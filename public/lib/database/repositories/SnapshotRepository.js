class SnapshotRepository {
  constructor(baseManager) {
    this.baseManager = baseManager;
  }

  // Snapshot operations
  getSnapshots(projectId) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(projectId);
        const stmt = projectDb.prepare(`
          SELECT * FROM snapshots ORDER BY created_at DESC
        `);
        const results = stmt.all().map((snapshot) => ({
          ...snapshot,
          data: JSON.parse(snapshot.data || "{}"),
          createdAt: new Date(snapshot.created_at),
        }));
        projectDb.close();
        return results;
      } catch (error) {
        console.error(
          `Failed to get snapshots for project ${projectId}:`,
          error
        );
        return [];
      }
    } else {
      // Memory fallback
      return this.baseManager.memoryStore.snapshots
        .filter((snapshot) => snapshot.projectId === projectId)
        .map((snapshot) => ({
          ...snapshot,
          createdAt: new Date(snapshot.createdAt),
        }));
    }
  }

  createSnapshot(snapshot) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(
          snapshot.projectId
        );
        const stmt = projectDb.prepare(`
          INSERT INTO snapshots (id, data_source_id, data, metadata, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
          snapshot.id,
          snapshot.dataSourceId || null,
          JSON.stringify(snapshot.data || {}),
          JSON.stringify(snapshot.metadata || {}),
          snapshot.createdAt.toISOString()
        );
        projectDb.close();
      } catch (error) {
        console.error(
          `Failed to create snapshot for project ${snapshot.projectId}:`,
          error
        );
        throw error;
      }
    } else {
      // Memory fallback
      this.baseManager.memoryStore.snapshots.push({
        id: snapshot.id,
        projectId: snapshot.projectId,
        dataSourceId: snapshot.dataSourceId || null,
        data: snapshot.data || {},
        metadata: snapshot.metadata || {},
        createdAt: snapshot.createdAt.toISOString(),
      });
      this.baseManager.saveMemoryStore();
    }
  }

  deleteSnapshot(id) {
    if (this.baseManager.db) {
      // Note: This would need to be implemented per project database
      // For now, we'll use memory fallback
      this.baseManager.memoryStore.snapshots =
        this.baseManager.memoryStore.snapshots.filter((s) => s.id !== id);
      this.baseManager.saveMemoryStore();
    } else {
      // Memory fallback
      this.baseManager.memoryStore.snapshots =
        this.baseManager.memoryStore.snapshots.filter((s) => s.id !== id);
      this.baseManager.saveMemoryStore();
    }
  }
}

module.exports = { SnapshotRepository };
