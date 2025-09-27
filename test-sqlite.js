const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test better-sqlite3 in the main process
  console.log("Testing better-sqlite3 in Electron main process...");

  try {
    const Database = require("better-sqlite3");
    console.log("✓ better-sqlite3 loaded successfully");

    const db = new Database(":memory:");
    console.log("✓ Database created successfully");

    // Test a simple query
    db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
    db.exec("INSERT INTO test (name) VALUES ('test')");

    const result = db.prepare("SELECT * FROM test").all();
    console.log("✓ Query executed successfully:", result);

    db.close();
    console.log("✓ Database closed successfully");
    console.log("🎉 All tests passed! better-sqlite3 is working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Error details:", error);
  }

  mainWindow.loadURL(
    "data:text/html,<h1>SQLite Test Complete</h1><p>Check the console for results.</p>"
  );
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
