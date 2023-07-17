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
  const files = [];
  const supportedRenderers = config.supportedRenderers || ["webgl"];

  if (supportedRenderers.includes("webgl")) {
    files.push("effect.fx");
  }

  if (supportedRenderers.includes("webgl2")) {
    files.push("effect.webgl2.fx");
  }

  if (supportedRenderers.includes("webgpu")) {
    files.push("effect.wgsl");
  }

  return files;
}

function addonFromConfig(config) {
  return {
    "is-c3-addon": true,
    type: config.addonType,
    name: config.name,
    id: config.id,
    "supported-renderers": config.supportedRenderers || ["webgl"],
    version: config.version,
    author: config.author,
    website: config.website,
    documentation: config.documentation,
    description: config.description,
    "file-list": [
      "lang/en-US.json",
      "addon.json",
      ...getFileListFromConfig(config),
    ],
    category: config.category,
    "blends-background": config.blendsBackground,
    "uses-depth": config.usesDepth,
    "cross-sampling": config.crossSampling,
    "preserves-opaqueness": config.preservesOpaqueness,
    animated: config.animated,
    "must-predraw": config.mustPredraw,
    "extend-box": config.extendBox,
    "is-deprecated": config.isDeprecated,
    parameters: config.parameters.map((parameter) => {
      const ret = {
        ...parameter,
        "initial-value": parameter.value,
      };
      delete ret.value;
      return ret;
    }),
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
  } else {
    throw new Error("Invalid addon type");
  }
  root.name = config.name;
  root.description = config.description;
  root.parameters = {};
  config.parameters.forEach((parameter) => {
    root.parameters[parameter.id] = {
      name: parameter.name,
      desc: parameter.desc,
    };
  });

  return lang;
}

if (fs.existsSync("./export")) {
  removeFilesRecursively("./export");
}

// create lang folder
fs.mkdirSync("./export");
fs.mkdirSync("./export/lang");

// import config from config.js
const config = require("./src/effectConfig.js");

const addonJson = addonFromConfig(config);
// write addon.json
fs.writeFileSync("./export/addon.json", JSON.stringify(addonJson, null, 2));

const lang = langFromConfig(config);
// write lang/en-US.json
fs.writeFileSync("./export/lang/en-US.json", JSON.stringify(lang, null, 2));

const supportedRenderers = config.supportedRenderers || ["webgl"];
if (supportedRenderers.includes("webgl")) {
  // read effect.fx
  const effectFx = fs.readFileSync("./src/effect.fx", "utf8");
  const effectFxWithUniforms = effectFx.replaceAll(
    "//<-- UNIFORMS -->",
    config.parameters
      .map((parameter) => {
        return `uniform ${
          parameter.hasOwnProperty("precision") ? uniform.precisiion : "lowp"
        } ${parameter.type === "color" ? "vec3" : "float"} ${
          parameter.uniform
        };`;
      })
      .join("\n")
  );
  // write effect.fx
  fs.writeFileSync("./export/effect.fx", effectFxWithUniforms);
}

if (supportedRenderers.includes("webgl2")) {
  // read effect.webgl2.fx
  const effectWebgl2Fx = fs.readFileSync("./src/effect.webgl2.fx", "utf8");
  const effectWebgl2FxWithUniforms = effectWebgl2Fx.replaceAll(
    "//<-- UNIFORMS -->",
    config.parameters
      .map((parameter) => {
        return `uniform ${
          parameter.hasOwnProperty("precision") ? uniform.precisiion : "lowp"
        } ${parameter.type === "color" ? "vec3" : "float"} ${
          parameter.uniform
        };`;
      })
      .join("\n")
  );
  // write effect.webgl2.fx
  fs.writeFileSync("./export/effect.webgl2.fx", effectWebgl2FxWithUniforms);
}

if (supportedRenderers.includes("webgpu")) {
  // read effect.wgsl
  const effectWgsl = fs.readFileSync("./src/effect.wgsl", "utf8");
  const effectWgslWithUniforms = effectWgsl.replaceAll(
    "//<-- shaderParams -->",
    `struct ShaderParams {
	${config.parameters
    .map((parameter) => {
      return `  ${parameter.uniform} : ${
        parameter.type === "color" ? "vec3<f32>" : "f32"
      }`;
    })
    .join(",\n")}
};
%%SHADERPARAMS_BINDING%% var<uniform> shaderParams : ShaderParams;`
  );
  // write effect.wgsl
  fs.writeFileSync("./export/effect.wgsl", effectWgslWithUniforms);
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
