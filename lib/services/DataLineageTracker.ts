import { clientLogger } from "../utils/ClientLogger";

export interface DataLineageNode {
  id: string;
  type:
    | "data_source"
    | "transformation"
    | "consolidated_model"
    | "workflow"
    | "export";
  name: string;
  description?: string;
  metadata: {
    dataSourceId?: string;
    workflowId?: string;
    modelId?: string;
    recordCount?: number;
    columns?: string[];
    lastUpdated?: Date;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DataLineageEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: "direct" | "transformation" | "aggregation" | "filter" | "join";
  metadata: {
    transformation?: string;
    columns?: string[];
    filters?: any[];
    joins?: any[];
    [key: string]: any;
  };
  createdAt: Date;
}

export interface DataLineagePath {
  id: string;
  sourceId: string;
  targetId: string;
  nodes: string[];
  edges: string[];
  totalTransformations: number;
  dataFlow: "forward" | "backward" | "bidirectional";
  createdAt: Date;
}

export interface DataLineageImpact {
  nodeId: string;
  affectedNodes: string[];
  impactType: "direct" | "indirect" | "cascade";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  estimatedAffectedRecords: number;
}

export class DataLineageTracker {
  private static instance: DataLineageTracker;
  private nodes: Map<string, DataLineageNode> = new Map();
  private edges: Map<string, DataLineageEdge> = new Map();
  private paths: Map<string, DataLineagePath> = new Map();

  static getInstance(): DataLineageTracker {
    if (!DataLineageTracker.instance) {
      DataLineageTracker.instance = new DataLineageTracker();
    }
    return DataLineageTracker.instance;
  }

  // Node Management
  addNode(
    node: Omit<DataLineageNode, "id" | "createdAt" | "updatedAt">
  ): string {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newNode: DataLineageNode = {
      ...node,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.nodes.set(id, newNode);

    clientLogger.info("Data lineage node added", "data-processing", {
      nodeId: id,
      type: node.type,
      name: node.name,
    });

    return id;
  }

  updateNode(nodeId: string, updates: Partial<DataLineageNode>): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const updatedNode = {
      ...node,
      ...updates,
      updatedAt: new Date(),
    };

    this.nodes.set(nodeId, updatedNode);

    clientLogger.info("Data lineage node updated", "data-processing", {
      nodeId,
      updates: Object.keys(updates),
    });

    return true;
  }

  removeNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all edges connected to this node
    const connectedEdges = Array.from(this.edges.values()).filter(
      (edge) => edge.sourceId === nodeId || edge.targetId === nodeId
    );

    connectedEdges.forEach((edge) => {
      this.edges.delete(edge.id);
    });

    // Remove all paths that include this node
    const affectedPaths = Array.from(this.paths.values()).filter((path) =>
      path.nodes.includes(nodeId)
    );

    affectedPaths.forEach((path) => {
      this.paths.delete(path.id);
    });

    this.nodes.delete(nodeId);

    clientLogger.info("Data lineage node removed", "data-processing", {
      nodeId,
      removedEdges: connectedEdges.length,
      removedPaths: affectedPaths.length,
    });

    return true;
  }

  // Edge Management
  addEdge(edge: Omit<DataLineageEdge, "id" | "createdAt">): string {
    const id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate that both source and target nodes exist
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      throw new Error("Source or target node does not exist");
    }

    const newEdge: DataLineageEdge = {
      ...edge,
      id,
      createdAt: new Date(),
    };

    this.edges.set(id, newEdge);

    clientLogger.info("Data lineage edge added", "data-processing", {
      edgeId: id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
    });

    return id;
  }

  removeEdge(edgeId: string): boolean {
    const edge = this.edges.get(edgeId);
    if (!edge) return false;

    this.edges.delete(edgeId);

    clientLogger.info("Data lineage edge removed", "data-processing", {
      edgeId,
    });

    return true;
  }

  // Path Analysis
  findPaths(
    sourceId: string,
    targetId: string,
    maxDepth: number = 10
  ): DataLineagePath[] {
    const paths: DataLineagePath[] = [];
    const visited = new Set<string>();

    const dfs = (currentId: string, path: string[], depth: number) => {
      if (depth > maxDepth || visited.has(currentId)) return;

      if (currentId === targetId && path.length > 1) {
        const pathId = `path_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const edges = [];

        for (let i = 0; i < path.length - 1; i++) {
          const edge = Array.from(this.edges.values()).find(
            (e) => e.sourceId === path[i] && e.targetId === path[i + 1]
          );
          if (edge) edges.push(edge.id);
        }

        const dataPath: DataLineagePath = {
          id: pathId,
          sourceId,
          targetId,
          nodes: [...path],
          edges,
          totalTransformations: edges.length,
          dataFlow: "forward",
          createdAt: new Date(),
        };

        paths.push(dataPath);
        this.paths.set(pathId, dataPath);
        return;
      }

      visited.add(currentId);
      const outgoingEdges = Array.from(this.edges.values()).filter(
        (edge) => edge.sourceId === currentId
      );

      for (const edge of outgoingEdges) {
        dfs(edge.targetId, [...path, edge.targetId], depth + 1);
      }

      visited.delete(currentId);
    };

    dfs(sourceId, [sourceId], 0);
    return paths;
  }

  // Impact Analysis
  analyzeImpact(nodeId: string): DataLineageImpact[] {
    const impacts: DataLineageImpact[] = [];
    const node = this.nodes.get(nodeId);

    if (!node) return impacts;

    // Find all nodes that depend on this node (forward impact)
    const dependentNodes = this.findDependentNodes(nodeId);

    // Find all nodes that this node depends on (backward impact)
    const dependencyNodes = this.findDependencyNodes(nodeId);

    // Calculate impact severity
    const totalAffected = dependentNodes.length + dependencyNodes.length;
    let severity: "low" | "medium" | "high" | "critical";

    if (totalAffected === 0) severity = "low";
    else if (totalAffected <= 3) severity = "medium";
    else if (totalAffected <= 10) severity = "high";
    else severity = "critical";

    // Forward impact
    if (dependentNodes.length > 0) {
      impacts.push({
        nodeId,
        affectedNodes: dependentNodes,
        impactType: "direct",
        severity,
        description: `Changes to ${node.name} will affect ${dependentNodes.length} downstream nodes`,
        estimatedAffectedRecords: this.estimateAffectedRecords(dependentNodes),
      });
    }

    // Backward impact
    if (dependencyNodes.length > 0) {
      impacts.push({
        nodeId,
        affectedNodes: dependencyNodes,
        impactType: "indirect",
        severity,
        description: `${node.name} depends on ${dependencyNodes.length} upstream nodes`,
        estimatedAffectedRecords: this.estimateAffectedRecords(dependencyNodes),
      });
    }

    return impacts;
  }

  private findDependentNodes(nodeId: string): string[] {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const outgoingEdges = Array.from(this.edges.values()).filter(
        (edge) => edge.sourceId === currentId
      );

      for (const edge of outgoingEdges) {
        dependents.add(edge.targetId);
        dfs(edge.targetId);
      }
    };

    dfs(nodeId);
    return Array.from(dependents);
  }

  private findDependencyNodes(nodeId: string): string[] {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      const incomingEdges = Array.from(this.edges.values()).filter(
        (edge) => edge.targetId === currentId
      );

      for (const edge of incomingEdges) {
        dependencies.add(edge.sourceId);
        dfs(edge.sourceId);
      }
    };

    dfs(nodeId);
    return Array.from(dependencies);
  }

  private estimateAffectedRecords(nodeIds: string[]): number {
    let totalRecords = 0;

    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node && node.metadata.recordCount) {
        totalRecords += node.metadata.recordCount;
      }
    }

    return totalRecords;
  }

  // Data Source Integration
  trackDataSource(dataSourceId: string, name: string, metadata: any): string {
    return this.addNode({
      type: "data_source",
      name,
      description: `Data source: ${name}`,
      metadata: {
        dataSourceId,
        ...metadata,
      },
    });
  }

  trackTransformation(
    sourceId: string,
    targetId: string,
    transformation: string,
    metadata: any
  ): string {
    return this.addEdge({
      sourceId,
      targetId,
      type: "transformation",
      metadata: {
        transformation,
        ...metadata,
      },
    });
  }

  trackConsolidatedModel(
    modelId: string,
    name: string,
    sourceIds: string[],
    metadata: any
  ): string {
    const modelNodeId = this.addNode({
      type: "consolidated_model",
      name,
      description: `Consolidated model: ${name}`,
      metadata: {
        modelId,
        ...metadata,
      },
    });

    // Create edges from all source data sources to the model
    for (const sourceId of sourceIds) {
      this.addEdge({
        sourceId,
        targetId: modelNodeId,
        type: "aggregation",
        metadata: {
          transformation: "consolidated_model",
          ...metadata,
        },
      });
    }

    return modelNodeId;
  }

  // Query Methods
  getNode(nodeId: string): DataLineageNode | undefined {
    return this.nodes.get(nodeId);
  }

  getEdge(edgeId: string): DataLineageEdge | undefined {
    return this.edges.get(edgeId);
  }

  getAllNodes(): DataLineageNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): DataLineageEdge[] {
    return Array.from(this.edges.values());
  }

  getNodesByType(type: DataLineageNode["type"]): DataLineageNode[] {
    return Array.from(this.nodes.values()).filter((node) => node.type === type);
  }

  getEdgesByType(type: DataLineageEdge["type"]): DataLineageEdge[] {
    return Array.from(this.edges.values()).filter((edge) => edge.type === type);
  }

  getNodeConnections(nodeId: string): {
    incoming: DataLineageEdge[];
    outgoing: DataLineageEdge[];
  } {
    const incoming = Array.from(this.edges.values()).filter(
      (edge) => edge.targetId === nodeId
    );
    const outgoing = Array.from(this.edges.values()).filter(
      (edge) => edge.sourceId === nodeId
    );

    return { incoming, outgoing };
  }

  // Export/Import
  exportLineage(): {
    nodes: DataLineageNode[];
    edges: DataLineageEdge[];
    paths: DataLineagePath[];
  } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      paths: Array.from(this.paths.values()),
    };
  }

  importLineage(data: {
    nodes: DataLineageNode[];
    edges: DataLineageEdge[];
    paths: DataLineagePath[];
  }): void {
    // Clear existing data
    this.nodes.clear();
    this.edges.clear();
    this.paths.clear();

    // Import nodes
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }

    // Import edges
    for (const edge of data.edges) {
      this.edges.set(edge.id, edge);
    }

    // Import paths
    for (const path of data.paths) {
      this.paths.set(path.id, path);
    }

    clientLogger.info("Data lineage imported", "data-processing", {
      nodes: data.nodes.length,
      edges: data.edges.length,
      paths: data.paths.length,
    });
  }
}
