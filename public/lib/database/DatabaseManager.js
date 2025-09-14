const { BaseDatabaseManager } = require("./BaseDatabaseManager");
const { ProjectRepository } = require("./repositories/ProjectRepository");
const { DataSourceRepository } = require("./repositories/DataSourceRepository");
const { SnapshotRepository } = require("./repositories/SnapshotRepository");
const {
  RelationshipRepository,
} = require("./repositories/RelationshipRepository");
const {
  ConsolidatedModelRepository,
} = require("./repositories/ConsolidatedModelRepository");

class DatabaseManager {
  constructor() {
    this.baseManager = BaseDatabaseManager.getInstance();
    this.projects = new ProjectRepository(this.baseManager);
    this.dataSources = new DataSourceRepository(this.baseManager);
    this.snapshots = new SnapshotRepository(this.baseManager);
    this.relationships = new RelationshipRepository(this.baseManager);
    this.consolidatedModels = new ConsolidatedModelRepository(this.baseManager);
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Project operations
  getProjects() {
    return this.projects.getProjects();
  }

  getProject(id) {
    return this.projects.getProject(id);
  }

  createProject(project) {
    return this.projects.createProject(project);
  }

  updateProject(id, updates) {
    return this.projects.updateProject(id, updates);
  }

  deleteProject(id) {
    return this.projects.deleteProject(id);
  }

  // Data source operations
  getDataSources(projectId) {
    return this.dataSources.getDataSources(projectId);
  }

  getDataSource(id) {
    return this.dataSources.getDataSource(id);
  }

  createDataSource(dataSource) {
    return this.dataSources.createDataSource(dataSource);
  }

  updateDataSource(id, updates) {
    return this.dataSources.updateDataSource(id, updates);
  }

  deleteDataSource(id) {
    return this.dataSources.deleteDataSource(id);
  }

  // Snapshot operations
  getSnapshots(projectId) {
    return this.snapshots.getSnapshots(projectId);
  }

  createSnapshot(snapshot) {
    return this.snapshots.createSnapshot(snapshot);
  }

  deleteSnapshot(id) {
    return this.snapshots.deleteSnapshot(id);
  }

  // Relationship operations
  getRelationships(projectId) {
    return this.relationships.getRelationships(projectId);
  }

  createRelationship(relationship) {
    return this.relationships.createRelationship(relationship);
  }

  deleteRelationship(id) {
    return this.relationships.deleteRelationship(id);
  }

  // Consolidated model operations
  getConsolidatedModels(projectId) {
    return this.consolidatedModels.getConsolidatedModels(projectId);
  }

  createConsolidatedModel(model) {
    return this.consolidatedModels.createConsolidatedModel(model);
  }

  updateConsolidatedModel(id, updates) {
    return this.consolidatedModels.updateConsolidatedModel(id, updates);
  }

  deleteConsolidatedModel(id) {
    return this.consolidatedModels.deleteConsolidatedModel(id);
  }

  // Utility methods
  close() {
    return this.baseManager.close();
  }
}

module.exports = { DatabaseManager };
