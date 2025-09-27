const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const { DatabaseManager } = require("./lib/database/index");

// Check if we're in Electron environment
if (!app) {
  console.error("Not running in Electron environment");
  process.exit(1);
}

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
console.log("Development mode:", isDev);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("isPackaged:", app.isPackaged);

let mainWindow;
let dbManager;
let handlersRegistered = false;

// Register IPC handlers only once
function registerIpcHandlers() {
  if (handlersRegistered) {
    console.log("IPC handlers already registered, skipping...");
    return;
  }

  console.log("Registering IPC handlers...");
  handlersRegistered = true;

  // Handle window controls
  ipcMain.handle("window-minimize", () => {
    console.log("Minimize window requested");
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle("window-maximize", () => {
    console.log("Maximize window requested");
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle("window-close", () => {
    console.log("Close window requested");
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // Database operations
  try {
    dbManager = DatabaseManager.getInstance();
    console.log("Database manager initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database manager:", error);
    dbManager = null;
  }

  // Project operations
  ipcMain.handle("get-projects", async () => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      return dbManager.getProjects();
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw error;
    }
  });

  ipcMain.handle("get-project", async (event, id) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      return dbManager.getProject(id);
    } catch (error) {
      console.error("Failed to get project:", error);
      throw error;
    }
  });

  ipcMain.handle("create-project", async (event, project) => {
    try {
      console.log("Creating project in Electron:", project);
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      dbManager.createProject(project);
      console.log("Project created successfully");
      return { success: true };
    } catch (error) {
      console.error("Failed to create project:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  });

  ipcMain.handle("update-project", async (event, id, updates) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      dbManager.updateProject(id, updates);
      return { success: true };
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  });

  ipcMain.handle("delete-project", async (event, id) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      dbManager.deleteProject(id);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  });

  // Data source operations
  ipcMain.handle("get-data-sources", async (event, projectId) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      return dbManager.getDataSources(projectId);
    } catch (error) {
      console.error("Failed to get data sources:", error);
      throw error;
    }
  });

  ipcMain.handle("create-data-source", async (event, dataSource) => {
    try {
      console.log("Electron: create-data-source called with:", dataSource);
      if (!dbManager) {
        console.error("Electron: Database manager not initialized");
        throw new Error("Database not initialized");
      }
      console.log("Electron: About to call dbManager.createDataSource");
      const result = dbManager.createDataSource(dataSource);
      console.log("Electron: Data source created successfully:", result);
      return result;
    } catch (error) {
      console.error("Electron: Failed to create data source:", error);
      console.error("Electron: Error stack:", error.stack);
      throw error;
    }
  });

  ipcMain.handle("update-data-source", async (event, id, updates) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      dbManager.updateDataSource(id, updates);
      return { success: true };
    } catch (error) {
      console.error("Failed to update data source:", error);
      throw error;
    }
  });

  ipcMain.handle("delete-data-source", async (event, id) => {
    try {
      if (!dbManager) {
        throw new Error("Database not initialized");
      }
      dbManager.deleteDataSource(id);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete data source:", error);
      throw error;
    }
  });

  // File operations
  ipcMain.handle("show-open-dialog", async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle("show-save-dialog", async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle("get-app-path", (event, name) => {
    return app.getPath(name);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    titleBarStyle: "hidden",
    frame: false,
    show: false,
    vibrancy: "under-window",
    visualEffectState: "active",
  });

  // Load the app
  if (isDev) {
    // Try port 3000 first, then fallback to 3001
    const devUrl = "http://localhost:3000";
    console.log("Loading development app from:", devUrl);
    mainWindow.loadURL(devUrl);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, try to load from the out directory
    const indexPath = path.join(__dirname, "../out/index.html");
    console.log("Loading from:", indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Handle window load errors
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error("Failed to load:", errorDescription, validatedURL);
      if (isDev) {
        // Try alternative ports if the first one fails
        const ports = [3000, 3001, 3002];
        const currentPort = parseInt(validatedURL.split(":")[2]) || 3000;
        const nextPort = ports.find((port) => port !== currentPort) || 3001;

        console.log(`Retrying with port ${nextPort}...`);
        setTimeout(() => {
          mainWindow.loadURL(`http://localhost:${nextPort}`);
        }, 2000);
      }
    }
  );

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    console.log("Window ready to show, displaying...");
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
  });

  // Debug window events
  mainWindow.on("show", () => {
    console.log("Window shown");
  });

  mainWindow.on("focus", () => {
    console.log("Window focused");
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  // Register IPC handlers first (only once)
  registerIpcHandlers();

  // Create the main window
  createWindow();

  // macOS specific behavior
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Set up application menu
  createMenu();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Save memory store before quitting
  if (dbManager) {
    dbManager.close();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Project",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-project");
          },
        },
        {
          label: "Open Project",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openDirectory"],
              title: "Select Project Directory",
            });
            if (!result.canceled) {
              mainWindow.webContents.send(
                "menu-open-project",
                result.filePaths[0]
              );
            }
          },
        },
        { type: "separator" },
        {
          label: "Import Data Source",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.send("menu-import-data");
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Manifold",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Manifold",
              message: "Manifold v0.1.0",
              detail: "A powerful data integration and consolidation tool",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
