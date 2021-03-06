#!/usr/bin/env node

// expressinit - Copyright Interfiber 2021

const inquirer = require("inquirer");
const fs = require("fs");
const ora = require("ora");
const esformatter = require('esformatter');
const { execSync } = require('child_process');
let isApi = false;
let isStatic = false;
let staticDir = "";
let pkgManager = "npm";
let installArg = "install";
let deps = [];
function askPkgManager(){
  inquirer.prompt([{
    type: "list",
    name: "pkgManager",
    message: "Choose Package Manager",
    choices: [
      "yarn",
      "npm",
      "pnpm"
    ]
  }]).then((answers) => {
    pkgManager = answers.pkgManager;
    if (pkgManager == "yarn"){
      installArg = "add";
    }
    createApp();
  })
}
function createApp(){
  // First Prompt for pkg manager
  inquirer.prompt([{
    type: 'confirm',
    name: "confirmapp",
    message: "Create App?",
    default: true
  }]).then(answer => {
    if (answer.confirmapp == true){
      // Create a fancy progress spinner
      const spinner = ora('Generating App...').start();
      spinner.color = 'cyan';
      let pkgjson = JSON.stringify({
        name: "express_app",
        version: "0.0.1",
        description: "A Basic Express app bootstrapped by @interfiber/expressinit",
        main: "main.js",
        scripts: {
          "dev": "nodemon main.js",
          "start": "node main.js"
        },
        author: "Interfiber",
        license: "MIT"
      }, null, 4);
      fs.writeFileSync("package.json", pkgjson);
      deps.forEach(dep => {
        execSync(`${pkgManager} ${installArg} ${dep} &>/dev/null`);
      })
      execSync(`${pkgManager} ${installArg} express &>/dev/null`);
      if (pkgManager == "yarn"){
        execSync("yarn add -D nodemon &>/dev/null");
      }else {
        execSync(`${pkgManager} ${installArg} --save-dev nodemon &>/dev/null`);
      }
      let requires = 'const express = require("express")\nconst app = express();'
      if (isStatic) {
        requires += `\napp.use(express.static("${staticDir}"))`
      }
      deps.forEach(dep => {
        if (dep == "body-parser"){
          requires += `\nlet ${dep.replace("-", "_")} = require("${dep}")\napp.use(${dep.replace("-", "_")}.urlencoded({ extended: true }))\napp.use(${dep.replace("-", "_")}.json())`
        }else if (dep == "dotenv"){
          requires += `\nlet dotenv = require("dotenv").config()`
        }else if (dep == "morgan"){
          requires += `\nlet morgan = require("morgan")\napp.use(morgan("tiny"))`
        }else {
          requires += `\nlet ${dep.replace("-", "_")} = require("${dep}")\napp.use(${dep.replace("-", "_")}())`
        }
      })
      requires += `\napp.get("/", (req, res) => {
          res.send("This is a starter express app")
      })\napp.listen(8080, () => {
          console.log("App Listening on port 8080(http://localhost:8080)")
      })`
      fs.writeFileSync("main.js.ugly", requires);
      const codeStr = fs.readFileSync('main.js.ugly').toString();
      const options = {
        indent : {
          value: '  '
        },
        lineBreak: {
          before: {
            BlockStatement : '>=1',
            DoWhileStatementOpeningBrace : 1,
          }
        }
      }
      const formattedCode = esformatter.format(codeStr, options);
      fs.writeFileSync("main.js", formattedCode);
      execSync("rm main.js.ugly")
      spinner.stop();
      console.log("🥳 Express app created!");
    }else {
      console.log("Bye!");
      process.exit(1);
    }
  })
}
function chooseDeps(){
  inquirer.prompt([{
    type: 'checkbox',
    name: 'dependencies',
    message: 'Choose Dependencies',
    choices: [
      "cors",
      "body-parser",
      "helmet",
      "express-fileupload",
      "multer",
      "dotenv",
      "helmet",
      "morgan",
      "vhost"
    ]
  }]).then(answer => {
    deps = answer.dependencies;
    askPkgManager();
  });
}
function askStaticDir(){
  inquirer.prompt([{
    type: 'text',
    name: 'staticDir',
    message: 'Enter Directory static file directory',
    default: "static"
  }]).then(answer => {
    staticDir = answer.staticDir
    chooseDeps()
  });
}
function askStatic(){
  inquirer.prompt([{
    type: 'confirm',
    name: 'isStatic',
    message: 'Will this express app host static files?',
    default: true
  }]).then(answer => {
    if (answer.isStatic){
      isStatic = true;
      askStaticDir();
    }
  });
}
inquirer.prompt([{
  type: 'confirm',
  name: 'isApi',
  message: 'Is this express project an api?',
  default: true
}]).then(answer => {
  if (!answer.isApi){
    isApi = true;
    askStatic();
  }else {
    chooseDeps();
  }
});
