const fs = require("fs/promises");
const path = require("path");

// Function to delete the file
const selfDestruct = () => {
  // Getting the path of the current file
  const selfPath = path.join(__dirname, "init.js");
  fs.unlink(selfPath, (err) => {
    if (err) {
      console.error("Failed to delete the file:", err);
    } else {
    }
  });
};

const optInsPath = path.join(__dirname, "opt-ins");
const commonPath = path.join(__dirname, "common");
const parentPath = __dirname;

async function main() {
  // Ensure common folder exists
  await fs.mkdir(commonPath, { recursive: true });

  try {
    const folders = await getSubfolders(optInsPath);
    const selectedFolders = await promptUserToSelectFolders(folders);
    await processConfigOverrides(folders, selectedFolders);
    await copySelectedFolders(selectedFolders);
    await moveContentsToParent();
    await cleanUp();
    console.log("Init completed successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

async function getSubfolders(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  return entries
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

async function promptUserToSelectFolders(folders) {
  const inquirer = (await import("inquirer")).default;
  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selectedFolders",
      message: "Select folders to add:",
      choices: folders,
    },
  ]);
  return answers.selectedFolders;
}

async function copySelectedFolders(selectedFolders) {
  for (const folder of selectedFolders) {
    const srcPath = path.join(optInsPath, folder);
    await copyFolder(srcPath, commonPath);
  }
}

async function copyFolder(src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyFolder(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function moveContentsToParent() {
  await copyFolder(commonPath, parentPath);
}

function findLine(file, text) {
  const lines = file.split("\n");
  const line = lines.findIndex((line) => line.includes(text));
  return line;
}

async function processConfigOverrides(dirNames, selectedFolders) {
  const pluginConfigPath = path.join(commonPath, "src", "pluginConfig.js");
  let pluginConfigContents = await fs.readFile(pluginConfigPath, "utf8");
  for (const folder of dirNames) {
    console.log("Adding opt-in", folder);
    const pluginOverridesPath = path.join(
      optInsPath,
      folder,
      "src",
      "configOverride.txt"
    );
    const commentStart = `<OPT_IN_${folder.toUpperCase()}_START>`;
    const commentEnd = `<OPT_IN_${folder.toUpperCase()}_END>`;
    const startLine = findLine(pluginConfigContents, commentStart);
    const endLine = findLine(pluginConfigContents, commentEnd);
    if (startLine === -1 || endLine === -1) {
      continue;
    }
    const overrideExists = await fs
      .access(pluginOverridesPath)
      .then(() => true)
      .catch(() => false);
    const pluginArr = pluginConfigContents.split("\n");
    if (!selectedFolders.includes(folder) || !overrideExists) {
      // remove the start and end lines from the plugin config
      pluginConfigContents = pluginArr
        .filter((_, index) => index !== startLine && index !== endLine)
        .join("\n");
    } else {
      const overrides = await fs.readFile(pluginOverridesPath, "utf8");
      const overridesArr = overrides.split("\n");
      pluginConfigContents = [
        ...pluginArr.slice(0, startLine),
        ...overridesArr,
        ...pluginArr.slice(endLine + 1),
      ].join("\n");

      // destroy the overrides file
      await fs.rm(pluginOverridesPath);
    }

    await fs.writeFile(pluginConfigPath, pluginConfigContents);
  }
}

async function cleanUp() {
  await fs.rm(optInsPath, { recursive: true, force: true });
  await fs.rm(commonPath, { recursive: true, force: true });
  selfDestruct();
}

main();
