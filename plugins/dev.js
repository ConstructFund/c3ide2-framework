const express = require("express");
const { exec } = require("child_process");
const chokidar = require("chokidar");
const cors = require("cors");

const path = "http://localhost:3000/addon.json";

// Execute build command
const runBuild = () => {
  console.log("Running build...");
  exec("node build.js --dev", (error, stdout, stderr) => {
    if (error) {
      console.log(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log("Build complete.");
    // log addon.json file path and copy it to the clipboard
    console.log("addon.json file path:");
    console.log(path);
  });
};

// Run initial build
runBuild();

// Watch for file changes in the src directory
const watcher = chokidar.watch("src", {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});

watcher.on("change", (path) => {
  console.log(`File ${path} has been changed. Re-running build...`);
  runBuild();
});

// Create an express application
const app = express();

// Enable all CORS requests
app.use(cors());

// Serve static files from the 'export' directory
app.use(express.static("export"));

// Start the server
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");

  // log addon.json file path and copy it to the clipboard
  console.log("addon.json file path:");
  console.log(path);
  // copy to clipboard
  exec(`echo ${path} | clip`);
});
