#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var optimist = require("optimist");

var argv = optimist
    .usage("Usage: nodebug script.js [options]")
    .options("help",       { alias: "h", describe: "Show this help" })
    .options("web-host",   { "default": "127.0.0.1", describe: "Web host used by node-inspector" })
    .options("web-port",   { "default": 8080, describe: "Web port used by node-inspector" })
    .options("debug-port", { "default": 5858, describe: "Debug port used by node" })
    .options("debug-brk",  { "default": true, describe: "Break on first line of script" })
    .argv;

if (argv["help"]) {
    showHelp();
}

if (!argv["_"].length) {
    showError("script required", true);
}

if (process.platform !== "win32") {
    showError("unsupported platform", false);
}

executeScript();
startNodeInspector();
launchWebBrowser();

function executeScript() {
    var nodePath = process.execPath;
    var nodeArgs = [];

    if (argv["debug-brk"]) {
        nodeArgs.push("--debug-brk=" + argv["debug-port"]);
    } else {
        nodeArgs.push("--debug=" + argv["debug-port"]);
    }

    nodeArgs = nodeArgs.concat(argv["_"]);

    return child_process.spawn(nodePath, nodeArgs, { stdio: "inherit" }).on("exit", process.exit);
}

function startNodeInspector() {
    var nodeInspectorPath;
    
    switch (process.platform) {
        case "win32":
            nodeInspectorPath = path.join(__dirname, "..\\node_modules\\.bin\\node-inspector.cmd");
            break;

        default:
            nodeInspectorPath = path.join(__dirname, "../node_modules/.bin/node-inspector");
            break;
    }

    var nodeInspectorArgs = [];
    nodeInspectorArgs.push("--web-host=" + argv["web-host"]);
    nodeInspectorArgs.push("--web-port=" + argv["web-port"]);

    return child_process.execFile(nodeInspectorPath, nodeInspectorArgs);
}

function launchWebBrowser() {
    var webBrowserPath;
    var searchPaths = [];

    switch (process.platform) {
        case "win32":
            searchPaths.push(path.join(process.env["LocalAppData"], ".\\Google\\Chrome\\Application\\chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles"], ".\\Google\\Chrome\\Application\\chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles(x86)"], ".\\Google\\Chrome\\Application\\chrome.exe"));
            break;

        case "darwin":
            searchPaths.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
            break;

        default:
            searchPaths.push("/opt/google/chrome/google-chrome");
            break;
    }

    for (var i = 0; i < searchPaths.length; i++) {
        if (fs.existsSync(searchPaths[i])) {
            webBrowserPath = searchPaths[i];
            break;
        }
    }

    var webBrowserArgs = [];
    webBrowserArgs.push("http://" + argv["web-host"] + ":" + argv["web-port"] + "/debug?port=" + argv["debug-port"]);

    return child_process.execFile(webBrowserPath, webBrowserArgs);
}

function showHelp() {
    console.log(optimist.help().trim());
    process.exit(0);
}

function showError(message, includeHelp) {
    if (includeHelp) {
        console.error("Error: " + message + "\n" + optimist.help().trim());
    } else {
        console.error("Error: " + message);
    }
    
    process.exit(1);
}
