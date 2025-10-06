/**
 * Data Lineage Tracking Service
 * 
 * Tracks and visualizes data flow through the platform:
 * - Source to destination paths
 * - All transformations applied
 * - Pipeline dependencies
 * - Field-level lineage
 * - Impact analysis
 * - Lineage graph generation
 */

import { logger } from '../utils/logger';

// ==================== TYPES ====================

export type LineageNodeType = 
  | 'data_source'
  | 'pipeline'
  | 'transformation'
  | 'snapshot'
  | 'export'
  | 'stream';

export interface LineageNode {
  id: string;
  type: LineageNodeType;
  name: string;
  displayName?: string;
  metadata?: Record<string, any>;
  
  // Visual positioning (for graph layout)
  level?: number;
  position?: { x: number; y: number };
}

export interface LineageEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label?: string;
  type?: 'data_flow' | 'dependency' | 'derivation';
  metadata?: {
    recordCount?: number;
    transformationType?: string;
    executedAt?: Date;
  };
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  metadata: {
    rootNodes: string[]; // Starting points (data sources)
    leafNodes: string[]; // End points (exports, snapshots)
    depth: number; // Maximum depth of graph
    totalNodes: number;
    totalEdges: number;
  };
}

export interface FieldLineage {
  sourceField: string;
  sourceNode: string;
  targetField: string;
  targetNode: string;
  transformations: string[]; // List of transformations applied
}

export interface LineageQuery {
  nodeId: string;
  direction?: 'upstream' | 'downstream' | 'both';
  depth?: number; // How many levels to traverse
  includeFieldLevel?: boolean;
}

export interface ImpactAnalysis {
  affectedNodes: LineageNode[];
  affectedPipelines: string[];
  affectedDataSources: string[];
  totalImpact: number;
  criticalPaths: string[][];
}

// ==================== DATA LINEAGE SERVICE ====================

export class DataLineageService {
  private static instance: DataLineageService;
  
  private nodes: Map<string, LineageNode> = new Map();
  private edges: Map<string, LineageEdge> = new Map();
  private fieldLineages: Map<string, FieldLineage[]> = new Map();
  
  // Adjacency lists for fast traversal
  private upstreamMap: Map<string, Set<string>> = new Map();
  private downstreamMap: Map<string, Set<string>> = new Map();

  static getInstance(): DataLineageService {
    if (!DataLineageService.instance) {
      DataLineageService.instance = new DataLineageService();
    }
    return DataLineageService.instance;
  }

  constructor() {}

  // ==================== NODE MANAGEMENT ====================

  /**
   * Register a lineage node
   */
  registerNode(node: LineageNode): void {
    this.nodes.set(node.id, node);

    logger.info(`Lineage node registered: ${node.name}`, 'lineage', {
      nodeId: node.id,
      type: node.type,
    });
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): LineageNode | null {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): LineageNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: LineageNodeType): LineageNode[] {
    return this.getAllNodes().filter(node => node.type === type);
  }

  // ==================== EDGE MANAGEMENT ====================

  /**
   * Create a lineage edge (connection between nodes)
   */
  createEdge(edge: LineageEdge): void {
    this.edges.set(edge.id, edge);

    // Update adjacency maps
    if (!this.downstreamMap.has(edge.source)) {
      this.downstreamMap.set(edge.source, new Set());
    }
    this.downstreamMap.get(edge.source)!.add(edge.target);

    if (!this.upstreamMap.has(edge.target)) {
      this.upstreamMap.set(edge.target, new Set());
    }
    this.upstreamMap.get(edge.target)!.add(edge.source);

    logger.info('Lineage edge created', 'lineage', {
      edgeId: edge.id,
      from: edge.source,
      to: edge.target,
    });
  }

  /**
   * Get edge by ID
   */
  getEdge(edgeId: string): LineageEdge | null {
    return this.edges.get(edgeId) || null;
  }

  /**
   * Get all edges
   */
  getAllEdges(): LineageEdge[] {
    return Array.from(this.edges.values());
  }

  // ==================== LINEAGE TRACKING ====================

  /**
   * Track data flow (creates node and edge)
   */
  trackDataFlow(params: {
    sourceNodeId: string;
    targetNodeId: string;
    transformationType?: string;
    recordCount?: number;
  }): LineageEdge {
    const edge: LineageEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: params.sourceNodeId,
      target: params.targetNodeId,
      type: 'data_flow',
      metadata: {
        transformationType: params.transformationType,
        recordCount: params.recordCount,
        executedAt: new Date(),
      },
    };

    this.createEdge(edge);

    return edge;
  }

  /**
   * Track pipeline execution lineage
   */
  trackPipelineExecution(params: {
    pipelineId: string;
    inputSources: string[];
    outputTarget?: string;
    transformations: string[];
  }): void {
    logger.info('Tracking pipeline execution lineage', 'lineage', {
      pipelineId: params.pipelineId,
      sources: params.inputSources.length,
      transformations: params.transformations.length,
    });

    // Register pipeline node if not exists
    if (!this.nodes.has(params.pipelineId)) {
      this.registerNode({
        id: params.pipelineId,
        type: 'pipeline',
        name: params.pipelineId,
      });
    }

    // Create edges from sources to pipeline
    for (const sourceId of params.inputSources) {
      this.trackDataFlow({
        sourceNodeId: sourceId,
        targetNodeId: params.pipelineId,
      });
    }

    // Create edges for each transformation
    let previousNode = params.pipelineId;
    for (const transformId of params.transformations) {
      if (!this.nodes.has(transformId)) {
        this.registerNode({
          id: transformId,
          type: 'transformation',
          name: transformId,
        });
      }

      this.trackDataFlow({
        sourceNodeId: previousNode,
        targetNodeId: transformId,
      });

      previousNode = transformId;
    }

    // Create edge to output if specified
    if (params.outputTarget) {
      this.trackDataFlow({
        sourceNodeId: previousNode,
        targetNodeId: params.outputTarget,
      });
    }
  }

  // ==================== LINEAGE QUERIES ====================

  /**
   * Get lineage for a specific node
   */
  getLineage(query: LineageQuery): LineageGraph {
    const { nodeId, direction = 'both', depth = 10 } = query;

    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];

    // Get upstream lineage
    if (direction === 'upstream' || direction === 'both') {
      this.traverseUpstream(nodeId, depth, visitedNodes, visitedEdges);
    }

    // Get downstream lineage
    if (direction === 'downstream' || direction === 'both') {
      this.traverseDownstream(nodeId, depth, visitedNodes, visitedEdges);
    }

    // Always include the query node
    visitedNodes.add(nodeId);

    // Collect nodes and edges
    for (const id of visitedNodes) {
      const node = this.nodes.get(id);
      if (node) nodes.push(node);
    }

    for (const id of visitedEdges) {
      const edge = this.edges.get(id);
      if (edge) edges.push(edge);
    }

    // Calculate metadata
    const rootNodes = nodes
      .filter(node => !this.upstreamMap.has(node.id) || this.upstreamMap.get(node.id)!.size === 0)
      .map(node => node.id);

    const leafNodes = nodes
      .filter(node => !this.downstreamMap.has(node.id) || this.downstreamMap.get(node.id)!.size === 0)
      .map(node => node.id);

    const graphDepth = this.calculateGraphDepth(nodes, edges);

    return {
      nodes,
      edges,
      metadata: {
        rootNodes,
        leafNodes,
        depth: graphDepth,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    };
  }

  /**
   * Traverse upstream dependencies
   */
  private traverseUpstream(
    nodeId: string,
    depth: number,
    visitedNodes: Set<string>,
    visitedEdges: Set<string>,
    currentDepth: number = 0
  ): void {
    if (currentDepth >= depth) return;

    visitedNodes.add(nodeId);

    const upstream = this.upstreamMap.get(nodeId);
    if (!upstream) return;

    for (const upstreamNodeId of upstream) {
      if (!visitedNodes.has(upstreamNodeId)) {
        // Find edge
        for (const [edgeId, edge] of this.edges.entries()) {
          if (edge.source === upstreamNodeId && edge.target === nodeId) {
            visitedEdges.add(edgeId);
          }
        }

        this.traverseUpstream(upstreamNodeId, depth, visitedNodes, visitedEdges, currentDepth + 1);
      }
    }
  }

  /**
   * Traverse downstream dependencies
   */
  private traverseDownstream(
    nodeId: string,
    depth: number,
    visitedNodes: Set<string>,
    visitedEdges: Set<string>,
    currentDepth: number = 0
  ): void {
    if (currentDepth >= depth) return;

    visitedNodes.add(nodeId);

    const downstream = this.downstreamMap.get(nodeId);
    if (!downstream) return;

    for (const downstreamNodeId of downstream) {
      if (!visitedNodes.has(downstreamNodeId)) {
        // Find edge
        for (const [edgeId, edge] of this.edges.entries()) {
          if (edge.source === nodeId && edge.target === downstreamNodeId) {
            visitedEdges.add(edgeId);
          }
        }

        this.traverseDownstream(downstreamNodeId, depth, visitedNodes, visitedEdges, currentDepth + 1);
      }
    }
  }

  /**
   * Calculate graph depth
   */
  private calculateGraphDepth(nodes: LineageNode[], edges: LineageEdge[]): number {
    // Simplified depth calculation
    const levels = new Map<string, number>();

    // Find root nodes
    const rootNodes = nodes.filter(node =>
      !edges.some(edge => edge.target === node.id)
    );

    // BFS to assign levels
    const queue: Array<{ nodeId: string; level: number }> = rootNodes.map(node => ({
      nodeId: node.id,
      level: 0,
    }));

    let maxDepth = 0;

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      if (levels.has(nodeId)) continue;
      levels.set(nodeId, level);
      maxDepth = Math.max(maxDepth, level);

      // Add children
      const childEdges = edges.filter(e => e.source === nodeId);
      for (const edge of childEdges) {
        queue.push({ nodeId: edge.target, level: level + 1 });
      }
    }

    return maxDepth;
  }

  // ==================== IMPACT ANALYSIS ====================

  /**
   * Analyze impact of changes to a node
   */
  analyzeImpact(nodeId: string): ImpactAnalysis {
    logger.info('Analyzing impact', 'lineage', { nodeId });

    // Get all downstream nodes
    const lineage = this.getLineage({
      nodeId,
      direction: 'downstream',
      depth: 10,
    });

    const affectedPipelines = lineage.nodes
      .filter(n => n.type === 'pipeline')
      .map(n => n.id);

    const affectedDataSources = lineage.nodes
      .filter(n => n.type === 'data_source')
      .map(n => n.id);

    // Find critical paths (paths with most dependencies)
    const criticalPaths = this.findCriticalPaths(nodeId);

    return {
      affectedNodes: lineage.nodes,
      affectedPipelines,
      affectedDataSources,
      totalImpact: lineage.nodes.length,
      criticalPaths,
    };
  }

  /**
   * Find critical paths from a node
   */
  private findCriticalPaths(nodeId: string, maxPaths: number = 5): string[][] {
    const paths: string[][] = [];
    const currentPath: string[] = [];

    this.dfsPath(nodeId, currentPath, paths, maxPaths);

    // Sort by path length (longest paths are most critical)
    return paths.sort((a, b) => b.length - a.length).slice(0, maxPaths);
  }

  /**
   * DFS to find all paths
   */
  private dfsPath(
    nodeId: string,
    currentPath: string[],
    allPaths: string[][],
    maxPaths: number
  ): void {
    if (allPaths.length >= maxPaths) return;

    currentPath.push(nodeId);

    const downstream = this.downstreamMap.get(nodeId);

    if (!downstream || downstream.size === 0) {
      // Leaf node - save path
      allPaths.push([...currentPath]);
    } else {
      for (const downstreamNodeId of downstream) {
        if (!currentPath.includes(downstreamNodeId)) { // Avoid cycles
          this.dfsPath(downstreamNodeId, currentPath, allPaths, maxPaths);
        }
      }
    }

    currentPath.pop();
  }

  // ==================== FIELD-LEVEL LINEAGE ====================

  /**
   * Track field-level lineage
   */
  trackFieldLineage(lineage: FieldLineage): void {
    const key = `${lineage.sourceNode}:${lineage.targetNode}`;

    if (!this.fieldLineages.has(key)) {
      this.fieldLineages.set(key, []);
    }

    this.fieldLineages.get(key)!.push(lineage);

    logger.info('Field lineage tracked', 'lineage', {
      sourceField: lineage.sourceField,
      targetField: lineage.targetField,
      transformations: lineage.transformations.length,
    });
  }

  /**
   * Get field lineage between two nodes
   */
  getFieldLineage(sourceNodeId: string, targetNodeId: string): FieldLineage[] {
    const key = `${sourceNodeId}:${targetNodeId}`;
    return this.fieldLineages.get(key) || [];
  }

  // ==================== LINEAGE EXPORT ====================

  /**
   * Export lineage as DOT format (for Graphviz)
   */
  exportToDOT(graph: LineageGraph): string {
    let dot = 'digraph DataLineage {\n';
    dot += '  rankdir=LR;\n'; // Left to right layout
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    for (const node of graph.nodes) {
      const color = this.getNodeColor(node.type);
      const shape = this.getNodeShape(node.type);
      
      dot += `  "${node.id}" [label="${node.name}", fillcolor="${color}", shape=${shape}, style=filled];\n`;
    }

    dot += '\n';

    // Add edges
    for (const edge of graph.edges) {
      const label = edge.label || edge.metadata?.transformationType || '';
      dot += `  "${edge.source}" -> "${edge.target}" [label="${label}"];\n`;
    }

    dot += '}\n';

    return dot;
  }

  /**
   * Get node color for visualization
   */
  private getNodeColor(type: LineageNodeType): string {
    const colors: Record<LineageNodeType, string> = {
      data_source: '#4299E1',
      pipeline: '#48BB78',
      transformation: '#ED8936',
      snapshot: '#9F7AEA',
      export: '#F56565',
      stream: '#38B2AC',
    };

    return colors[type] || '#A0AEC0';
  }

  /**
   * Get node shape for visualization
   */
  private getNodeShape(type: LineageNodeType): string {
    const shapes: Record<LineageNodeType, string> = {
      data_source: 'cylinder',
      pipeline: 'box',
      transformation: 'diamond',
      snapshot: 'folder',
      export: 'note',
      stream: 'parallelogram',
    };

    return shapes[type] || 'box';
  }

  /**
   * Export lineage as JSON
   */
  exportToJSON(graph: LineageGraph): string {
    return JSON.stringify(graph, null, 2);
  }

  // ==================== STATISTICS ====================

  /**
   * Get lineage statistics
   */
  getStatistics(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<LineageNodeType, number>;
    avgDownstreamDependencies: number;
    avgUpstreamDependencies: number;
    orphanedNodes: number;
  } {
    const nodesByType: any = {};
    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    let totalDownstream = 0;
    let totalUpstream = 0;

    for (const deps of this.downstreamMap.values()) {
      totalDownstream += deps.size;
    }

    for (const deps of this.upstreamMap.values()) {
      totalUpstream += deps.size;
    }

    const orphanedNodes = this.getAllNodes().filter(node =>
      (!this.upstreamMap.has(node.id) || this.upstreamMap.get(node.id)!.size === 0) &&
      (!this.downstreamMap.has(node.id) || this.downstreamMap.get(node.id)!.size === 0)
    ).length;

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      avgDownstreamDependencies: this.nodes.size > 0 ? totalDownstream / this.nodes.size : 0,
      avgUpstreamDependencies: this.nodes.size > 0 ? totalUpstream / this.nodes.size : 0,
      orphanedNodes,
    };
  }

  /**
   * Clear all lineage data
   */
  clearAll(): void {
    this.nodes.clear();
    this.edges.clear();
    this.fieldLineages.clear();
    this.upstreamMap.clear();
    this.downstreamMap.clear();

    logger.info('All lineage data cleared', 'lineage');
  }
}

// Export singleton instance
export const dataLineage = DataLineageService.getInstance();

