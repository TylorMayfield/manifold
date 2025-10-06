/**
 * Data Lineage Unit Tests
 */

import { DataLineageService, LineageNodeType } from '../../lib/services/DataLineage';

describe('DataLineageService', () => {
  let service: DataLineageService;

  beforeEach(() => {
    service = DataLineageService.getInstance();
    service.clearAll();
  });

  describe('Node Management', () => {
    it('should register a node', () => {
      service.registerNode({
        id: 'customers-db',
        type: 'data_source',
        name: 'Customer Database',
      });

      const node = service.getNode('customers-db');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Customer Database');
    });

    it('should get nodes by type', () => {
      service.registerNode({ id: 'ds-1', type: 'data_source', name: 'Source 1' });
      service.registerNode({ id: 'pipe-1', type: 'pipeline', name: 'Pipeline 1' });
      service.registerNode({ id: 'ds-2', type: 'data_source', name: 'Source 2' });

      const dataSources = service.getNodesByType('data_source');
      expect(dataSources).toHaveLength(2);
    });

    it('should get all nodes', () => {
      service.registerNode({ id: 'node-1', type: 'data_source', name: 'Node 1' });
      service.registerNode({ id: 'node-2', type: 'pipeline', name: 'Node 2' });

      const allNodes = service.getAllNodes();
      expect(allNodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Management', () => {
    beforeEach(() => {
      service.registerNode({ id: 'source', type: 'data_source', name: 'Source' });
      service.registerNode({ id: 'pipeline', type: 'pipeline', name: 'Pipeline' });
    });

    it('should create an edge', () => {
      service.createEdge({
        id: 'edge-1',
        source: 'source',
        target: 'pipeline',
        type: 'data_flow',
      });

      const edge = service.getEdge('edge-1');
      expect(edge).toBeDefined();
      expect(edge?.source).toBe('source');
      expect(edge?.target).toBe('pipeline');
    });

    it('should get all edges', () => {
      service.createEdge({ id: 'edge-1', source: 'source', target: 'pipeline', type: 'data_flow' });

      const edges = service.getAllEdges();
      expect(edges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Flow Tracking', () => {
    it('should track data flow', () => {
      service.registerNode({ id: 'source', type: 'data_source', name: 'Source' });
      service.registerNode({ id: 'target', type: 'data_source', name: 'Target' });

      const edge = service.trackDataFlow({
        sourceNodeId: 'source',
        targetNodeId: 'target',
        transformationType: 'filter',
        recordCount: 1000,
      });

      expect(edge).toBeDefined();
      expect(edge.metadata?.transformationType).toBe('filter');
      expect(edge.metadata?.recordCount).toBe(1000);
    });

    it('should track pipeline execution', () => {
      service.registerNode({ id: 'source-1', type: 'data_source', name: 'Source 1' });
      service.registerNode({ id: 'source-2', type: 'data_source', name: 'Source 2' });

      service.trackPipelineExecution({
        pipelineId: 'pipe-123',
        inputSources: ['source-1', 'source-2'],
        outputTarget: 'output-db',
        transformations: ['filter-1', 'join-1'],
      });

      const pipelineNode = service.getNode('pipe-123');
      expect(pipelineNode).toBeDefined();
      expect(pipelineNode?.type).toBe('pipeline');

      const edges = service.getAllEdges();
      expect(edges.length).toBeGreaterThan(0);
    });
  });

  describe('Lineage Queries', () => {
    beforeEach(() => {
      // Create a simple lineage graph
      service.registerNode({ id: 'source', type: 'data_source', name: 'Source' });
      service.registerNode({ id: 'pipeline', type: 'pipeline', name: 'Pipeline' });
      service.registerNode({ id: 'transform', type: 'transformation', name: 'Transform' });
      service.registerNode({ id: 'output', type: 'data_source', name: 'Output' });

      service.createEdge({ id: 'e1', source: 'source', target: 'pipeline', type: 'data_flow' });
      service.createEdge({ id: 'e2', source: 'pipeline', target: 'transform', type: 'data_flow' });
      service.createEdge({ id: 'e3', source: 'transform', target: 'output', type: 'data_flow' });
    });

    it('should get downstream lineage', () => {
      const lineage = service.getLineage({
        nodeId: 'source',
        direction: 'downstream',
        depth: 10,
      });

      expect(lineage.nodes.length).toBeGreaterThan(0);
      expect(lineage.nodes.some(n => n.id === 'pipeline')).toBe(true);
      expect(lineage.nodes.some(n => n.id === 'output')).toBe(true);
    });

    it('should get upstream lineage', () => {
      const lineage = service.getLineage({
        nodeId: 'output',
        direction: 'upstream',
        depth: 10,
      });

      expect(lineage.nodes.length).toBeGreaterThan(0);
      expect(lineage.nodes.some(n => n.id === 'source')).toBe(true);
      expect(lineage.nodes.some(n => n.id === 'pipeline')).toBe(true);
    });

    it('should respect depth limit', () => {
      const lineage = service.getLineage({
        nodeId: 'source',
        direction: 'downstream',
        depth: 1,
      });

      // Should only go 1 level deep
      expect(lineage.metadata.depth).toBeLessThanOrEqual(1);
    });

    it('should include metadata', () => {
      const lineage = service.getLineage({
        nodeId: 'source',
        direction: 'downstream',
      });

      expect(lineage.metadata).toBeDefined();
      expect(lineage.metadata.totalNodes).toBeGreaterThan(0);
      expect(lineage.metadata.totalEdges).toBeGreaterThan(0);
      expect(lineage.metadata.rootNodes).toBeDefined();
      expect(lineage.metadata.leafNodes).toBeDefined();
    });
  });

  describe('Impact Analysis', () => {
    beforeEach(() => {
      // Create a graph with multiple downstream paths
      service.registerNode({ id: 'source', type: 'data_source', name: 'Source' });
      service.registerNode({ id: 'pipe-1', type: 'pipeline', name: 'Pipeline 1' });
      service.registerNode({ id: 'pipe-2', type: 'pipeline', name: 'Pipeline 2' });
      service.registerNode({ id: 'output-1', type: 'data_source', name: 'Output 1' });
      service.registerNode({ id: 'output-2', type: 'data_source', name: 'Output 2' });

      service.createEdge({ id: 'e1', source: 'source', target: 'pipe-1', type: 'data_flow' });
      service.createEdge({ id: 'e2', source: 'source', target: 'pipe-2', type: 'data_flow' });
      service.createEdge({ id: 'e3', source: 'pipe-1', target: 'output-1', type: 'data_flow' });
      service.createEdge({ id: 'e4', source: 'pipe-2', target: 'output-2', type: 'data_flow' });
    });

    it('should analyze downstream impact', () => {
      const impact = service.analyzeImpact('source');

      expect(impact.totalImpact).toBeGreaterThan(0);
      expect(impact.affectedPipelines).toContain('pipe-1');
      expect(impact.affectedPipelines).toContain('pipe-2');
      expect(impact.affectedDataSources.length).toBeGreaterThan(0);
    });

    it('should identify critical paths', () => {
      const impact = service.analyzeImpact('source');

      expect(impact.criticalPaths).toBeDefined();
      expect(impact.criticalPaths.length).toBeGreaterThan(0);
    });
  });

  describe('Field-Level Lineage', () => {
    it('should track field lineage', () => {
      service.trackFieldLineage({
        sourceField: 'first_name',
        sourceNode: 'customers-db',
        targetField: 'full_name',
        targetNode: 'customer-360',
        transformations: ['concatenate'],
      });

      const fieldLineage = service.getFieldLineage('customers-db', 'customer-360');
      
      expect(fieldLineage).toHaveLength(1);
      expect(fieldLineage[0].sourceField).toBe('first_name');
      expect(fieldLineage[0].targetField).toBe('full_name');
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', () => {
      service.registerNode({ id: 'ds-1', type: 'data_source', name: 'DS 1' });
      service.registerNode({ id: 'pipe-1', type: 'pipeline', name: 'Pipe 1' });
      service.createEdge({ id: 'e1', source: 'ds-1', target: 'pipe-1', type: 'data_flow' });

      const stats = service.getStatistics();

      expect(stats.totalNodes).toBeGreaterThan(0);
      expect(stats.totalEdges).toBeGreaterThan(0);
      expect(stats.nodesByType).toBeDefined();
    });
  });
});

