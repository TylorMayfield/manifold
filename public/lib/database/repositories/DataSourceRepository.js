class DataSourceRepository {
  constructor(baseManager) {
    this.baseManager = baseManager;
  }

  // Helper function to safely parse dates
  parseDate(dateString) {
    if (!dateString) return null;

    // Debug logging to see what date strings we're getting
    console.log(`[DEBUG] Parsing date string: "${dateString}"`);

    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime());

    if (!isValid) {
      console.error(`[ERROR] Invalid date string: "${dateString}"`);
      return null;
    }

    console.log(`[DEBUG] Successfully parsed date: ${date.toISOString()}`);
    return date;
  }

  // Data source operations
  getDataSources(projectId) {
    if (this.baseManager.db) {
      try {
        const projectDb = this.baseManager.getProjectDatabase(projectId);
        const stmt = projectDb.prepare(`
          SELECT * FROM data_sources ORDER BY created_at DESC
        `);
        const results = stmt.all().map((ds) => ({
          ...ds,
          config: JSON.parse(ds.config || "{}"),
          createdAt: this.parseDate(ds.created_at),
          updatedAt: this.parseDate(ds.updated_at),
          lastSyncAt: this.parseDate(ds.last_sync_at),
        }));
        projectDb.close();
        return results;
      } catch (error) {
        console.error(
          `Failed to get data sources for project ${projectId}:`,
          error
        );
        return [];
      }
    } else {
      // Memory fallback
      return this.baseManager.memoryStore.dataSources
        .filter((ds) => ds.projectId === projectId)
        .map((ds) => ({
          ...ds,
          createdAt: this.parseDate(ds.createdAt),
          updatedAt: this.parseDate(ds.updatedAt),
          lastSyncAt: this.parseDate(ds.lastSyncAt),
        }));
    }
  }

  getDataSource(id) {
    if (this.baseManager.db) {
      try {
        console.log(`[DEBUG] Getting data source: ${id}`);

        // Search through all project databases to find the data source
        const projects = this.baseManager.getProjects();

        for (const project of projects) {
          try {
            const projectDb = this.baseManager.getProjectDatabase(project.id);

            const stmt = projectDb.prepare(`
              SELECT * FROM data_sources WHERE id = ?
            `);
            const result = stmt.get(id);

            if (result) {
              console.log(
                `[DEBUG] Found data source ${id} in project ${project.id}`
              );
              projectDb.close();
              return {
                ...result,
                config: JSON.parse(result.config || "{}"),
                createdAt: this.parseDate(result.created_at),
                updatedAt: this.parseDate(result.updated_at),
                lastSyncAt: this.parseDate(result.last_sync_at),
                projectId: project.id, // Add project ID to the result
              };
            }

            projectDb.close();
          } catch (error) {
            console.error(
              `[ERROR] Error checking project ${project.id} for data source ${id}:`,
              error
            );
          }
        }

        console.log(
          `[DEBUG] Data source ${id} not found in any project database`
        );
        return null;
      } catch (error) {
        console.error(`[ERROR] Failed to get data source ${id}:`, error);
        return null;
      }
    } else {
      // Memory fallback
      const dataSource = this.baseManager.memoryStore.dataSources.find(
        (ds) => ds.id === id
      );
      return dataSource
        ? {
            ...dataSource,
            createdAt: this.parseDate(dataSource.createdAt),
            updatedAt: this.parseDate(dataSource.updatedAt),
            lastSyncAt: this.parseDate(dataSource.lastSyncAt),
          }
        : null;
    }
  }

  createDataSource(dataSource) {
    if (this.baseManager.db) {
      try {
        console.log(
          `[DEBUG] Creating data source for project: ${dataSource.projectId}`
        );
        console.log(`[DEBUG] Data source details:`, {
          id: dataSource.id,
          name: dataSource.name,
          type: dataSource.type,
          projectId: dataSource.projectId,
        });

        // First, verify the project exists in the hub database
        const projectExists = this.baseManager.getProject(dataSource.projectId);
        console.log(
          `[DEBUG] Project exists check:`,
          projectExists ? "EXISTS" : "NOT FOUND"
        );

        if (!projectExists) {
          throw new Error(
            `Project ${dataSource.projectId} not found in hub database`
          );
        }

        const projectDb = this.baseManager.getProjectDatabase(
          dataSource.projectId
        );
        console.log(
          `[DEBUG] Project database connection established for data source creation`
        );

        // Check all tables first
        const allTables = projectDb
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all();
        console.log(
          `[DEBUG] All tables in project database:`,
          allTables.map((t) => t.name)
        );

        // Verify that the data_sources table exists
        const tables = projectDb
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='data_sources'"
          )
          .all();
        console.log(`[DEBUG] data_sources table check result:`, tables);

        if (tables.length === 0) {
          console.error(
            `[ERROR] data_sources table not found for project ${dataSource.projectId}. Re-initializing project database.`
          );
          projectDb.close();
          this.baseManager.initializeProjectDatabase(dataSource.projectId);
          // Re-open the database after re-initialization
          const newProjectDb = this.baseManager.getProjectDatabase(
            dataSource.projectId
          );

          // Verify again after re-initialization
          const newTables = newProjectDb
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='data_sources'"
            )
            .all();
          console.log(
            `[DEBUG] data_sources table check after re-initialization:`,
            newTables
          );

          if (newTables.length === 0) {
            throw new Error(
              `Failed to create data_sources table for project ${dataSource.projectId} even after re-initialization`
            );
          }

          this.insertDataSource(newProjectDb, dataSource);
          newProjectDb.close();
        } else {
          console.log(
            `[DEBUG] data_sources table exists, proceeding with insertion`
          );
          this.insertDataSource(projectDb, dataSource);
          projectDb.close();
        }
      } catch (error) {
        console.error(
          `[ERROR] Failed to create data source for project ${dataSource.projectId}:`,
          error
        );
        console.error(`[ERROR] Error stack:`, error.stack);
        throw error;
      }
    } else {
      // Memory fallback
      this.baseManager.memoryStore.dataSources.push({
        id: dataSource.id,
        projectId: dataSource.projectId,
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config || {},
        status: dataSource.status || "pending",
        createdAt: dataSource.createdAt.toISOString(),
        updatedAt: dataSource.updatedAt.toISOString(),
        lastSyncAt: dataSource.lastSyncAt
          ? dataSource.lastSyncAt.toISOString()
          : null,
      });
      this.baseManager.saveMemoryStore();
    }
  }

  insertDataSource(projectDb, dataSource) {
    const stmt = projectDb.prepare(`
      INSERT INTO data_sources (id, name, type, config, status, created_at, updated_at, last_sync_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      dataSource.id,
      dataSource.name,
      dataSource.type,
      JSON.stringify(dataSource.config || {}),
      dataSource.status || "pending",
      dataSource.createdAt.toISOString(),
      dataSource.updatedAt.toISOString(),
      dataSource.lastSyncAt ? dataSource.lastSyncAt.toISOString() : null
    );
    console.log(`Data source inserted successfully: ${dataSource.id}`);
  }

  updateDataSource(id, updates) {
    if (this.baseManager.db) {
      try {
        console.log(
          `[DEBUG] Updating data source: ${id} with updates:`,
          updates
        );

        // First, we need to find which project this data source belongs to
        // We'll need to search through all project databases to find it
        // This is not ideal, but we need the project ID to get the right database

        // For now, let's get all projects and search through them
        const projects = this.baseManager.getProjects();
        let dataSourceFound = false;

        for (const project of projects) {
          try {
            const projectDb = this.baseManager.getProjectDatabase(project.id);

            // Check if this data source exists in this project database
            const existingDataSource = projectDb
              .prepare("SELECT id FROM data_sources WHERE id = ?")
              .get(id);

            if (existingDataSource) {
              console.log(
                `[DEBUG] Found data source ${id} in project ${project.id}`
              );

              // Update the data source in the correct project database
              const fields = [];
              const values = [];

              if (updates.name !== undefined) {
                fields.push("name = ?");
                values.push(updates.name);
              }
              if (updates.type !== undefined) {
                fields.push("type = ?");
                values.push(updates.type);
              }
              if (updates.config !== undefined) {
                fields.push("config = ?");
                values.push(JSON.stringify(updates.config));
              }
              if (updates.status !== undefined) {
                fields.push("status = ?");
                values.push(updates.status);
              }
              if (updates.lastSyncAt !== undefined) {
                fields.push("last_sync_at = ?");
                values.push(updates.lastSyncAt.toISOString());
              }

              if (fields.length === 0) {
                projectDb.close();
                return;
              }

              fields.push("updated_at = ?");
              values.push(new Date().toISOString());
              values.push(id);

              const stmt = projectDb.prepare(`
                UPDATE data_sources SET ${fields.join(", ")} WHERE id = ?
              `);
              stmt.run(...values);
              projectDb.close();

              console.log(
                `[DEBUG] Data source ${id} updated successfully in project ${project.id}`
              );
              dataSourceFound = true;
              break;
            }

            projectDb.close();
          } catch (error) {
            console.error(
              `[ERROR] Error checking project ${project.id} for data source ${id}:`,
              error
            );
          }
        }

        if (!dataSourceFound) {
          throw new Error(
            `Data source ${id} not found in any project database`
          );
        }
      } catch (error) {
        console.error(`[ERROR] Failed to update data source ${id}:`, error);
        throw error;
      }
    } else {
      // Memory fallback
      const dataSourceIndex =
        this.baseManager.memoryStore.dataSources.findIndex(
          (ds) => ds.id === id
        );
      if (dataSourceIndex !== -1) {
        if (updates.name !== undefined)
          this.baseManager.memoryStore.dataSources[dataSourceIndex].name =
            updates.name;
        if (updates.type !== undefined)
          this.baseManager.memoryStore.dataSources[dataSourceIndex].type =
            updates.type;
        if (updates.config !== undefined)
          this.baseManager.memoryStore.dataSources[dataSourceIndex].config =
            updates.config;
        if (updates.status !== undefined)
          this.baseManager.memoryStore.dataSources[dataSourceIndex].status =
            updates.status;
        if (updates.lastSyncAt !== undefined)
          this.baseManager.memoryStore.dataSources[dataSourceIndex].lastSyncAt =
            updates.lastSyncAt.toISOString();
        this.baseManager.memoryStore.dataSources[dataSourceIndex].updatedAt =
          new Date().toISOString();
        this.baseManager.saveMemoryStore();
      }
    }
  }

  deleteDataSource(id) {
    try {
      console.log(`[DEBUG] Deleting data source: ${id}`);

      if (this.baseManager.db) {
        // Get all projects to search through their databases
        const projects = this.baseManager.getProjects();
        console.log(
          `[DEBUG] Searching through ${projects.length} projects for data source ${id}`
        );

        for (const project of projects) {
          try {
            const projectDb = this.baseManager.getProjectDatabase(project.id);

            // Check if the data source exists in this project database
            const checkStmt = projectDb.prepare(`
              SELECT id FROM data_sources WHERE id = ?
            `);
            const existing = checkStmt.get(id);

            if (existing) {
              console.log(
                `[DEBUG] Found data source ${id} in project ${project.id}, deleting...`
              );

              // Delete the data source from the project database
              const deleteStmt = projectDb.prepare(`
                DELETE FROM data_sources WHERE id = ?
              `);
              deleteStmt.run(id);

              projectDb.close();

              console.log(
                `[DEBUG] Data source ${id} deleted successfully from project ${project.id}`
              );
              return true; // Successfully deleted
            }

            projectDb.close();
          } catch (error) {
            console.error(
              `[ERROR] Error checking/deleting from project ${project.id}:`,
              error
            );
          }
        }

        console.log(
          `[DEBUG] Data source ${id} not found in any project database`
        );
        return false; // Not found
      } else {
        // Memory fallback - search through all project data sources
        console.log(
          `[DEBUG] Using memory fallback for delete data source ${id}`
        );

        const projects = this.baseManager.getProjects();
        for (const project of projects) {
          const projectDataSources =
            this.baseManager.memoryStore.dataSources[project.id] || [];
          const initialLength = projectDataSources.length;

          // Filter out the data source to delete
          this.baseManager.memoryStore.dataSources[project.id] =
            projectDataSources.filter((ds) => ds.id !== id);

          // If the length changed, we found and deleted the data source
          if (
            this.baseManager.memoryStore.dataSources[project.id].length <
            initialLength
          ) {
            console.log(
              `[DEBUG] Data source ${id} deleted from memory store for project ${project.id}`
            );
            this.baseManager.saveMemoryStore();
            return true;
          }
        }

        console.log(`[DEBUG] Data source ${id} not found in memory store`);
        return false;
      }
    } catch (error) {
      console.error(`[ERROR] Failed to delete data source ${id}:`, error);
      throw error;
    }
  }
}

module.exports = { DataSourceRepository };
