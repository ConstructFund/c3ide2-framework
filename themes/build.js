const fs = require("fs");
const path = require("path");

// get command line arguments
const args = process.argv.slice(2);
const devBuild = args.includes("--dev");

function removeFilesRecursively(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function (file) {
      var curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        removeFilesRecursively(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

function getFileListFromConfig(config) {
  return config.stylesheets;
}

function addonFromConfig(config) {
  return {
    "is-c3-addon": true,
    "sdk-version": 2,
    type: config.addonType,
    name: config.name,
    id: config.id,
    version: config.version,
    author: config.author,
    "icon-type":
      config.icon && config.icon.endsWith(".png")
        ? "image/png"
        : "image/svg+xml",
    website: config.website,
    documentation: config.documentation,
    description: config.description,
    stylesheets: config.stylesheets,
    "file-list": [
      "lang/en-US.json",
      "addon.json",
      config.icon ? config.icon : "icon.svg",
      ...getFileListFromConfig(config),
    ],
  };
}

function langFromConfig(config) {
  let id = config.id.toLowerCase();
  const lang = {
    languageTag: "en-US",
    fileDescription: `Strings for ${id}.`,
    text: {},
  };

  let root;
  if (config.addonType === "plugin") {
    lang.text.plugins = {};
    lang.text.plugins[id] = {};
    root = lang.text.plugins[id];
  } else if (config.addonType === "behavior") {
    lang.text.behaviors = {};
    lang.text.behaviors[id] = {};
    root = lang.text.behaviors[id];
  } else if (config.addonType === "effect") {
    lang.text.effects = {};
    lang.text.effects[id] = {};
    root = lang.text.effects[id];
  } else if (config.addonType === "theme") {
    lang.text.themes = {};
    lang.text.themes[id] = {};
    root = lang.text.themes[id];
  } else {
    throw new Error("Invalid addon type");
  }
  root.name = config.name;
  root.description = config.description;
  root["help-url"] = config.documentation;
  return lang;
}

if (fs.existsSync("./export")) {
  removeFilesRecursively("./export");
}

// create lang folder
fs.mkdirSync("./export");
fs.mkdirSync("./export/lang");

// import config from config.js
const config = require("./src/themeConfig.js");

const addonJson = addonFromConfig(config);
// write addon.json
fs.writeFileSync("./export/addon.json", JSON.stringify(addonJson, null, 2));

const lang = langFromConfig(config);
// write lang/en-US.json
fs.writeFileSync("./export/lang/en-US.json", JSON.stringify(lang, null, 2));

// copy icon.svg
if (config.icon) {
  fs.copyFileSync("./src/" + config.icon, "./export/" + config.icon);
} else {
  fs.copyFileSync("./src/icon.svg", "./export/icon.svg");
}

if (config.stylesheets) {
  config.stylesheets.forEach((file) => {
    fs.copyFileSync(
      path.join(__dirname, "src", file),
      path.join(__dirname, "export", file)
    );
  });
}

if (!devBuild) {
  // zip the content of the export folder and name it with the plugin id and version and use .c3addon as extension
  var AdmZip = require("adm-zip");
  const zip = new AdmZip();
  zip.addLocalFolder("./export/lang", "lang");

  // for each remaining file in the root export folder
  fs.readdirSync("./export").forEach((file) => {
    // if the file is not the c3runtime or lang folder
    if (file !== "c3runtime" && file !== "lang") {
      // add it to the zip
      zip.addLocalFile(`./export/${file}`, "");
    }
  });

  // if dist folder does not exist, create it
  if (!fs.existsSync("./dist")) {
    fs.mkdirSync("./dist");
  }
  zip.writeZip(`./dist/${config.id}-${config.version}.c3addon`);
}
