const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const srcCppExists = fs.existsSync("./src_cpp");
if (!srcCppExists) {
  throw new Error(
    "Could not find src_cpp folder. Please make sure you have the src_cpp folder in the root of your project."
  );
}

// Paths
const solutionDirectory = "./src_cpp/Project";
const buildDirectory = "./src_cpp/Build";
const distDirectory = "./src";

const msBuildPaths = [
  // Visual Studio 2022
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe",

  // Visual Studio 2022 (x86)
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe",

  // Visual Studio 2019
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe",

  // Visual Studio 2017
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Community\\MSBuild\\15.0\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Professional\\MSBuild\\15.0\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\MSBuild\\15.0\\Bin\\MSBuild.exe",
  "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\BuildTools\\MSBuild\\Current\\Bin\\MSBuild.exe",

  // Visual Studio 2015
  "C:\\Program Files (x86)\\MSBuild\\14.0\\Bin\\MSBuild.exe",

  // Visual Studio 2013
  "C:\\Program Files (x86)\\MSBuild\\12.0\\Bin\\MSBuild.exe",

  // Visual Studio 2012
  "C:\\Program Files (x86)\\MSBuild\\11.0\\Bin\\MSBuild.exe",

  // Visual Studio 2010
  "C:\\Program Files (x86)\\MSBuild\\10.0\\Bin\\MSBuild.exe",

  // .NET Framework paths
  "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\MSBuild.exe", // 32-bit
  "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\MSBuild.exe", // 64-bit
];

let msbuildPath = "";
const findMSBuild = (paths, callback) => {
  let foundPath = "";

  paths.some((path) => {
    if (fs.existsSync(path)) {
      foundPath = path;
      return true;
    }
  });

  msbuildPath = foundPath;
};
findMSBuild(msBuildPaths);

// if it didn't find MSBuild, throw an error
if (!msbuildPath) {
  throw new Error(
    "Could not find MSBuild. Please install MSBuild and try again."
  );
}

// Build configurations
const configurations = [
  { configuration: "Release", platform: "x64" },
  { configuration: "Release", platform: "x86" },
];

// Function to run MSBuild
function buildSolution(configuration, platform) {
  return new Promise((resolve, reject) => {
    const command = `& "${msbuildPath}" "${path.join(
      solutionDirectory,
      "WrapperExtension.sln"
    )}" -t:Build /p:Configuration=${configuration} /p:Platform=${platform}`;

    console.log(command);

    exec(command, { shell: "powershell.exe" }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error building ${configuration}|${platform}: ${stderr}`);
        console.error(err);
        reject(err);
      } else {
        // console.log(stdout);
        console.log(`Built ${configuration}|${platform} successfully.`);
        resolve(stdout);
      }
    });
  });
}

runBuildWrapperExtension = async () => {
  try {
    // Build each configuration
    for (const config of configurations) {
      await buildSolution(config.configuration, config.platform);
    }
    // move all .dll files from the build directory to the dist directory
    fs.readdirSync(buildDirectory).forEach((file) => {
      if (file.endsWith(".dll")) {
        fs.copyFileSync(
          path.join(buildDirectory, file),
          path.join(distDirectory, file)
        );
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

module.exports = runBuildWrapperExtension;

// if this file has been ran directly, run the build
if (require.main === module) {
  runBuildWrapperExtension();
}
