class RelationshipRepository {
  constructor(baseManager) {
    this.baseManager = baseManager;
  }

  // Relationship operations
  getRelationships(projectId) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(projectId);
        const stmt = projectDb.prepare(`
          SELECT * FROM relationships ORDER BY created_at DESC
        `);
        const results = stmt.all().map((rel) => ({
          ...rel,
          metadata: JSON.parse(rel.metadata || "{}"),
          createdAt: new Date(rel.created_at),
        }));
        projectDb.close();
        return results;
      } catch (error) {
        console.error(
          `Failed to get relationships for project ${projectId}:`,
          error
        );
        return [];
      }
    } else {
      // Memory fallback
      return this.baseManager.memoryStore.relationships
        .filter((rel) => rel.projectId === projectId)
        .map((rel) => ({
          ...rel,
          createdAt: new Date(rel.createdAt),
        }));
    }
  }

  createRelationship(relationship) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(
          relationship.projectId
        );
        const stmt = projectDb.prepare(`
          INSERT INTO relationships (id, source_id, target_id, relationship_type, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          relationship.id,
          relationship.sourceId,
          relationship.targetId,
          relationship.relationshipType,
          JSON.stringify(relationship.metadata || {}),
          relationship.createdAt.toISOString()
        );
        projectDb.close();
      } catch (error) {
        console.error(
          `Failed to create relationship for project ${relationship.projectId}:`,
          error
        );
        throw error;
      }
    } else {
      // Memory fallback
      this.baseManager.memoryStore.relationships.push({
        id: relationship.id,
        projectId: relationship.projectId,
        sourceId: relationship.sourceId,
        targetId: relationship.targetId,
        relationshipType: relationship.relationshipType,
        metadata: relationship.metadata || {},
        createdAt: relationship.createdAt.toISOString(),
      });
      this.baseManager.saveMemoryStore();
    }
  }

  deleteRelationship(id) {
    if (this.baseManager.db) {
      // Note: This would need to be implemented per project database
      // For now, we'll use memory fallback
      this.baseManager.memoryStore.relationships =
        this.baseManager.memoryStore.relationships.filter((r) => r.id !== id);
      this.baseManager.saveMemoryStore();
    } else {
      // Memory fallback
      this.baseManager.memoryStore.relationships =
        this.baseManager.memoryStore.relationships.filter((r) => r.id !== id);
      this.baseManager.saveMemoryStore();
    }
  }
}

module.exports = { RelationshipRepository };
