const fs = require("fs");
const path = require("path");

const camelCasedMap = new Map();

function generateMDLinkFromText(text) {
  return text.replace(/ /g, "-").toLowerCase();
}

const config = require("./src/pluginConfig.js");

const readme = [];
readme.push(`# ${config.name} <br>`);
readme.push(`${config.description} <br>`);
readme.push(``);
readme.push(`Author: ${config.author} <br>`);
if (config.website && config.website !== "" && config.website !== "https://www.construct.net") {
  readme.push(`Website: ${config.website} <br>`)
}
if (config.addonUrl && config.addonUrl !== "") {
  readme.push(`Addon Url: ${config.addonUrl} <br>`);
}
if(config.githubUrl && config.githubUrl !== "") {
  readme.push(`Download Latest Version : [Version: ${config.version}](${config.githubUrl}/releases/latest) <br>`);
}

readme.push(`## Table of Contents`);
readme.push(`- [Usage](#usage)`);
readme.push(`- [Examples Files](#examples-files)`);
readme.push(`- [Properties](#properties)`);
readme.push(`- [Actions](#actions)`);
readme.push(`- [Conditions](#conditions)`);
readme.push(`- [Expressions](#expressions)`);


readme.push(`## Usage`);
readme.push(`To build the addon, run the following commands:`);
readme.push(``);
readme.push(`\`\`\``);
readme.push(`npm i`);
readme.push(`node ./build.js`);
readme.push(`\`\`\``);
readme.push(``);
readme.push(`To run the dev server, run`);
readme.push(``);
readme.push(`\`\`\``);
readme.push(`npm i`);
readme.push(`node ./dev.js`);
readme.push(`\`\`\``);
readme.push(``);
readme.push(`The build uses the pluginConfig file to generate everything else.`);
readme.push(
  `The main files you may want to look at would be instance.js and scriptInterface.js`
);


readme.push(`## Examples Files`);
const exampleFiles = fs.readdirSync(path.join(__dirname, "examples"));
exampleFiles.forEach((file) => {
  const fileName = file.split(".")[0];
  readme.push(`- [${fileName}](./examples/${file})`);
});


readme.push(`## Properties`);
readme.push(`| Property Name | Description`);
readme.push(`| --- | --- |`);

config.properties.forEach((property) => {
  readme.push(
    `| [${property.name}](#${generateMDLinkFromText(property.name)}) | ${property.desc} |`
  ); 
});
readme.push(`---`);

config.properties.forEach((property) => {
  readme.push(`### ${property.name}`);
  readme.push(`**Description:** ${property.desc} </br>`);
  readme.push(`**Type:** ${property.type}`);
  if (property.type === "combo") {
    readme.push(`**Options:**`);
    property.options.items.forEach((item) => {
      const key = Object.keys(item)[0];
      readme.push(`- ${key}: ${item[key]}`);
    });
  } else if (property.type === "link") {
    readme.push(`**Link Text:** ${property.linkText}`);
  }
});

readme.push(`## Actions`);
readme.push(`| Action | Description |`);
readme.push(`| --- | --- |`);

Object.keys(config.Acts).forEach((key) => {
  const action = config.Acts[key];
  readme.push(
    `| [${action.listName}](#${generateMDLinkFromText(action.listName)}) | ${action.description} |`
  );
});
readme.push(`---`);

Object.keys(config.Acts).forEach((key) => {
  const action = config.Acts[key];
  readme.push(`### ${action.listName}`);
  readme.push(`**Description:** ${action.description} </br>`);

  if (action.isAsync) {
    readme.push(`**Is Async:** ${action.isAsync} </br>`);
  } 

  if(action.params.length > 0){
    readme.push(`#### Parameters:`);
    // write parameters to indented table, with three columns (name, type, description)
    readme.push(`| Name | Type | Description |`);
    readme.push(`| --- | --- | --- |`);
    action.params.forEach((param) => {
      readme.push(
        `| ${param.name} | ${param.type} | ${param.desc} |`
      );
    });
  }
});


readme.push(`## Conditions`);
readme.push(`| Condition | Description |`);
readme.push(`| --- | --- |`);

Object.keys(config.Cnds).forEach((key) => {
  const condition = config.Cnds[key];
  readme.push(
    `| [${condition.listName}](#${generateMDLinkFromText(condition.listName)}) | ${condition.description} |`
  );
});
readme.push(`---`);

Object.keys(config.Cnds).forEach((key) => {
  const condition = config.Cnds[key];
  readme.push(`### ${condition.listName}`);
  readme.push(`**Description:** ${condition.description} </br>`);
  if (condition.isTrigger) {
    readme.push(`**Is Trigger:** ${action.isTrigger} </br>`);
  }
  if(condition.islooping) {
    readme.push(`**Is Looping:** ${action.islooping} </br>`);
  }

  if(condition.params.length > 0) {
    readme.push(`#### Parameters:`);
    // write parameters to indented table, with three columns (name, type, description)
    readme.push(`| Name | Type | Description |`);
    readme.push(`| --- | --- | --- |`);
    condition.params.forEach((param) => {
      readme.push(
        `| ${param.name} | ${param.type} | ${param.desc} |`
      );
    });
  }
});

readme.push(``);
readme.push(`## Expressions`);
readme.push(`| Expression | Description |`);
readme.push(`| --- | --- |`);

Object.keys(config.Exps).forEach((key) => {
  const expression = config.Exps[key];
  readme.push(
    `| [${key}](#${generateMDLinkFromText(key)}) | ${expression.description} |`
  );
});
readme.push(`---`);

Object.keys(config.Exps).forEach((key) => {
  const expression = config.Exps[key];
  readme.push(`### ${key}`);
  readme.push(`**Description:** ${expression.description} </br>`);
  readme.push(`**Return Type:** ${expression.returnType} </br>`);
  if(expression.isVariadicParam) {
    readme.push(`**Is Variadic Param:** ${expression.isVariadicParam} </br>`);
  }
  if(expression.params.length > 0) {
    readme.push(`#### Parameters:`);
    // write parameters to indented table, with three columns (name, type, description)
    readme.push(`| Name | Type | Description |`);
    readme.push(`| --- | --- | --- |`);
    expression.params.forEach((param) => {
      readme.push(
        `| ${param.name} | ${param.type} | ${param.desc} |`
      );
    });
  }
});


fs.writeFileSync(path.join(__dirname, "README.md"), readme.join("\n"));

