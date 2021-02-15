#!/usr/bin/env node

// expressinit - Copyright Interfiber 2021

const inquirer = require("inquirer");
const fs = require("fs");
const shelljs = require("shelljs");
const esformatter = require('esformatter');
let isApi = false;
let isStatic = false;
let staticDir = "";
let deps = [];
function createApp(){
  inquirer.prompt([{
    type: 'confirm',
    name: "confirmapp",
    message: "Create App?",
    default: true
  }]).then(answer => {
    if (answer.confirmapp == true){
      console.log("Creating package.json...");
      let pkgjson = JSON.stringify({
        name: "Package Name",
        version: "",
        description: "",
        main: "main.js",
        scripts: {
          "start": "node main.js"
        },
        author: "",
        license: ""
      }, null, 4);
      fs.writeFileSync("package.json", pkgjson);
      console.log("Installing packages...");
      deps.forEach(dep => {
        console.log(`Installing ${dep}...`);
        shelljs.exec(`npm i ${dep} &>/dev/null`);
      })
      console.log("Installing express...");
      shelljs.exec("npm i express &>/dev/null");
      console.log("Creating main.js...");
      let requires = 'const express = require("express")\nconst app = express();'
      if (isStatic) {
        requires += `\napp.use(express.static("${staticDir}"))`
      }
      deps.forEach(dep => {
        if (dep == "body-parser"){
          requires += `\nlet ${dep.replace("-", "_")} = require("${dep}")\napp.use(${dep.replace("-", "_")}.urlencoded({ extended: true }))\napp.use(${dep.replace("-", "_")}.json())`
        }else if (dep == "dotenv"){
          requires += `\nlet dotenv = require("dotenv").config()`
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
      console.log("Making JS pretty...");
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
      shelljs.rm("main.js.ugly");
      console.log("Express app created!");
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
      "dotenv"
    ]
  }]).then(answer => {
    deps = answer.dependencies;
    createApp();
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
