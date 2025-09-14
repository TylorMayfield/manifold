class ProjectRepository {
  constructor(baseManager) {
    this.baseManager = baseManager;
  }

  // Helper function to safely parse dates
  parseDate(dateString) {
    if (!dateString) return null;

    // Debug logging to see what date strings we're getting
    console.log(
      `[DEBUG] ProjectRepository parsing date string: "${dateString}"`
    );

    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime());

    if (!isValid) {
      console.error(`[ERROR] Invalid project date string: "${dateString}"`);
      return null;
    }

    console.log(
      `[DEBUG] ProjectRepository successfully parsed date: ${date.toISOString()}`
    );
    return date;
  }

  // Project operations
  getProjects() {
    if (this.baseManager.db) {
      const stmt = this.baseManager.db.prepare(`
        SELECT * FROM projects ORDER BY created_at DESC
      `);
      const results = stmt.all();
      return results.map((project) => ({
        ...project,
        createdAt: this.parseDate(project.created_at),
        updatedAt: this.parseDate(project.updated_at),
      }));
    } else {
      // Memory fallback
      return this.baseManager.memoryStore.projects.map((project) => ({
        ...project,
        createdAt: this.parseDate(project.createdAt),
        updatedAt: this.parseDate(project.updatedAt),
      }));
    }
  }

  getProject(id) {
    if (this.baseManager.db) {
      const stmt = this.baseManager.db.prepare(`
        SELECT * FROM projects WHERE id = ?
      `);
      const result = stmt.get(id);
      return result
        ? {
            ...result,
            createdAt: this.parseDate(result.created_at),
            updatedAt: this.parseDate(result.updated_at),
          }
        : null;
    } else {
      // Memory fallback
      const project = this.baseManager.memoryStore.projects.find(
        (p) => p.id === id
      );
      return project
        ? {
            ...project,
            createdAt: this.parseDate(project.createdAt),
            updatedAt: this.parseDate(project.updatedAt),
          }
        : null;
    }
  }

  createProject(project) {
    // Validate project object
    if (!project.id || !project.name || !project.dataPath) {
      throw new Error("Project missing required fields: id, name, or dataPath");
    }

    if (!project.createdAt || !project.updatedAt) {
      throw new Error(
        "Project missing required date fields: createdAt or updatedAt"
      );
    }

    console.log("Creating project in database:", {
      id: project.id,
      name: project.name,
      dataPath: project.dataPath,
      hasCreatedAt: !!project.createdAt,
      hasUpdatedAt: !!project.updatedAt,
    });

    if (this.baseManager.db) {
      const stmt = this.baseManager.db.prepare(`
        INSERT INTO projects (id, name, description, data_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        project.id,
        project.name,
        project.description || "",
        project.dataPath,
        project.createdAt.toISOString(),
        project.updatedAt.toISOString()
      );

      // Initialize project-specific database (spoke)
      console.log(
        `[DEBUG] About to initialize project database for project: ${project.id}`
      );
      this.baseManager.initializeProjectDatabase(project.id);
      console.log(
        `[DEBUG] Project database initialization completed for project: ${project.id}`
      );
    } else {
      // Memory fallback
      this.baseManager.memoryStore.projects.push({
        id: project.id,
        name: project.name,
        description: project.description || "",
        dataPath: project.dataPath,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      });
      this.baseManager.saveMemoryStore();
    }

    console.log("Project created successfully");
  }

  updateProject(id, updates) {
    if (this.baseManager.db) {
      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push("description = ?");
        values.push(updates.description);
      }
      if (updates.dataPath !== undefined) {
        fields.push("data_path = ?");
        values.push(updates.dataPath);
      }
      if (updates.updatedAt !== undefined) {
        fields.push("updated_at = ?");
        values.push(updates.updatedAt.toISOString());
      }

      if (fields.length === 0) return;

      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = this.baseManager.db.prepare(`
        UPDATE projects SET ${fields.join(", ")} WHERE id = ?
      `);
      stmt.run(...values);
    } else {
      // Memory fallback
      const projectIndex = this.baseManager.memoryStore.projects.findIndex(
        (p) => p.id === id
      );
      if (projectIndex !== -1) {
        if (updates.name !== undefined)
          this.baseManager.memoryStore.projects[projectIndex].name =
            updates.name;
        if (updates.description !== undefined)
          this.baseManager.memoryStore.projects[projectIndex].description =
            updates.description;
        if (updates.dataPath !== undefined)
          this.baseManager.memoryStore.projects[projectIndex].dataPath =
            updates.dataPath;
        this.baseManager.memoryStore.projects[projectIndex].updatedAt =
          new Date().toISOString();
        this.baseManager.saveMemoryStore();
      }
    }
  }

  deleteProject(id) {
    if (this.baseManager.db) {
      const stmt = this.baseManager.db.prepare(`
        DELETE FROM projects WHERE id = ?
      `);
      stmt.run(id);
    } else {
      // Memory fallback
      this.baseManager.memoryStore.projects =
        this.baseManager.memoryStore.projects.filter((p) => p.id !== id);
      this.baseManager.saveMemoryStore();
    }
  }
}

module.exports = { ProjectRepository };
