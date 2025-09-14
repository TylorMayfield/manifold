class ConsolidatedModelRepository {
  constructor(baseManager) {
    this.baseManager = baseManager;
  }

  // Consolidated model operations
  getConsolidatedModels(projectId) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(projectId);
        const stmt = projectDb.prepare(`
          SELECT * FROM consolidated_models ORDER BY created_at DESC
        `);
        const results = stmt.all().map((model) => ({
          ...model,
          modelData: JSON.parse(model.model_data || "{}"),
          metadata: JSON.parse(model.metadata || "{}"),
          createdAt: new Date(model.created_at),
          updatedAt: new Date(model.updated_at),
        }));
        projectDb.close();
        return results;
      } catch (error) {
        console.error(
          `Failed to get consolidated models for project ${projectId}:`,
          error
        );
        return [];
      }
    } else {
      // Memory fallback
      return this.baseManager.memoryStore.consolidatedModels
        .filter((model) => model.projectId === projectId)
        .map((model) => ({
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
        }));
    }
  }

  createConsolidatedModel(model) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(model.projectId);
        const stmt = projectDb.prepare(`
          INSERT INTO consolidated_models (id, name, model_data, metadata, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          model.id,
          model.name,
          JSON.stringify(model.modelData || {}),
          JSON.stringify(model.metadata || {}),
          model.createdAt.toISOString(),
          model.updatedAt.toISOString()
        );
        projectDb.close();
      } catch (error) {
        console.error(
          `Failed to create consolidated model for project ${model.projectId}:`,
          error
        );
        throw error;
      }
    } else {
      // Memory fallback
      this.baseManager.memoryStore.consolidatedModels.push({
        id: model.id,
        projectId: model.projectId,
        name: model.name,
        modelData: model.modelData || {},
        metadata: model.metadata || {},
        createdAt: model.createdAt.toISOString(),
        updatedAt: model.updatedAt.toISOString(),
      });
      this.baseManager.saveMemoryStore();
    }
  }

  updateConsolidatedModel(id, updates) {
    if (this.baseManager.db) {
      // Note: This would need to be implemented per project database
      // For now, we'll use memory fallback
      const modelIndex =
        this.baseManager.memoryStore.consolidatedModels.findIndex(
          (m) => m.id === id
        );
      if (modelIndex !== -1) {
        if (updates.name !== undefined)
          this.baseManager.memoryStore.consolidatedModels[modelIndex].name =
            updates.name;
        if (updates.modelData !== undefined)
          this.baseManager.memoryStore.consolidatedModels[
            modelIndex
          ].modelData = updates.modelData;
        if (updates.metadata !== undefined)
          this.baseManager.memoryStore.consolidatedModels[modelIndex].metadata =
            updates.metadata;
        this.baseManager.memoryStore.consolidatedModels[modelIndex].updatedAt =
          new Date().toISOString();
        this.baseManager.saveMemoryStore();
      }
    } else {
      // Memory fallback
      const modelIndex =
        this.baseManager.memoryStore.consolidatedModels.findIndex(
          (m) => m.id === id
        );
      if (modelIndex !== -1) {
        if (updates.name !== undefined)
          this.baseManager.memoryStore.consolidatedModels[modelIndex].name =
            updates.name;
        if (updates.modelData !== undefined)
          this.baseManager.memoryStore.consolidatedModels[
            modelIndex
          ].modelData = updates.modelData;
        if (updates.metadata !== undefined)
          this.baseManager.memoryStore.consolidatedModels[modelIndex].metadata =
            updates.metadata;
        this.baseManager.memoryStore.consolidatedModels[modelIndex].updatedAt =
          new Date().toISOString();
        this.baseManager.saveMemoryStore();
      }
    }
  }

  deleteConsolidatedModel(id) {
    if (this.baseManager.db) {
      // Note: This would need to be implemented per project database
      // For now, we'll use memory fallback
      this.baseManager.memoryStore.consolidatedModels =
        this.baseManager.memoryStore.consolidatedModels.filter(
          (m) => m.id !== id
        );
      this.baseManager.saveMemoryStore();
    } else {
      // Memory fallback
      this.baseManager.memoryStore.consolidatedModels =
        this.baseManager.memoryStore.consolidatedModels.filter(
          (m) => m.id !== id
        );
      this.baseManager.saveMemoryStore();
    }
  }
}

module.exports = { ConsolidatedModelRepository };
