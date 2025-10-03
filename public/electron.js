const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Note: Database operations are now handled by MongoDB through the Next.js API
// No direct database access from Electron main process

// CRITICAL: Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log("Another instance is already running. Exiting...");
  app.quit();
  process.exit(0);
}

// Check if we're in Electron environment
if (!app) {
  console.error("Not running in Electron environment");
  process.exit(1);
}

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
console.log("Development mode:", isDev);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("isPackaged:", app.isPackaged);

// Server URL configuration
let serverUrl = null;
let serverProcess = null;

async function startNextServer() {
  if (isDev) {
    // Development: use dev server
    serverUrl = "http://localhost:3000";
    console.log("Using development server at:", serverUrl);
    return;
  }

  // Production: Use simpler approach - load from static files if available
  // For now, we'll use the Next.js dev server approach even in production
  // This is a temporary solution until we properly configure standalone mode
  
  console.log("Production mode: attempting to start server...");
  
  // Try to find node executable
  let nodePath = process.platform === 'win32' ? 'node.exe' : 'node';
  
  // Check common node locations
  const possibleNodePaths = [
    path.join(process.resourcesPath, 'app', 'node_modules', '.bin', nodePath),
    path.join(process.resourcesPath, nodePath),
    nodePath // Try system PATH
  ];
  
  let foundNode = null;
  for (const np of possibleNodePaths) {
    if (fs.existsSync(np)) {
      foundNode = np;
      break;
    }
  }
  
  if (!foundNode) {
    foundNode = nodePath; // Use system node
  }
  
  console.log("Using Node.js at:", foundNode);
  
  const serverPath = path.join(process.resourcesPath, "app", ".next", "standalone", "server.js");
  
  if (!fs.existsSync(serverPath)) {
    console.error("Production server not found at:", serverPath);
    console.log("Expected path:", serverPath);
    console.log("Resource path:", process.resourcesPath);
    
    // For now, fall back to development mode
    console.log("FALLBACK: Using development server");
    serverUrl = "http://localhost:3000";
    return;
  }
  
  console.log("Starting Next.js server from:", serverPath);
  
  const { spawn } = require("child_process");
  const port = 3000;
  serverUrl = `http://localhost:${port}`;
  
  try {
    serverProcess = spawn(foundNode, [serverPath], {
      cwd: path.join(process.resourcesPath, "app", ".next", "standalone"),
      env: { 
        ...process.env, 
        NODE_ENV: "production",
        PORT: port.toString(),
        HOSTNAME: "localhost"
      },
      stdio: "pipe"
    });

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });

    serverProcess.on("error", (error) => {
      console.error("Failed to start server:", error);
    });

    serverProcess.on("exit", (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Wait for server to be ready
    console.log("Waiting for server to start...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("Server should be ready at:", serverUrl);
  } catch (error) {
    console.error("Error starting server:", error);
    // Fallback
    serverUrl = "http://localhost:3000";
  }
}

let mainWindow;
let handlersRegistered = false;

// Handle second instance
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log("Second instance detected, focusing main window");
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

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

  // NOTE: All database operations now go through the Next.js API routes
  // which use MongoDB. No direct database access from Electron main process.

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
    title: "Manifold - Data Integration Platform",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    // Use native Windows title bar
    frame: true,
    titleBarStyle: "default",
    show: false,
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: false, // Show menu bar
  });

  // Load the app
  console.log("Loading app from:", serverUrl);
  mainWindow.loadURL(serverUrl);
  
  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
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
app.whenReady().then(async () => {
  // Start Next.js server first
  await startNextServer();
  
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
  // Stop server process
  if (serverProcess) {
    console.log("Stopping server process...");
    try {
      serverProcess.kill();
    } catch (error) {
      console.error("Error stopping server:", error);
    }
  }
  
  // MongoDB connections are managed by the Next.js server
  // They will be cleaned up when the server stops
  console.log("Application shutting down cleanly");
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
