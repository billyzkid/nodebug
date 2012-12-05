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
    .options("keep-alive", { "default": false, describe: "Keep child processes alive after exit" })
    .argv;

if (argv["help"]) {
    showHelp();
}

if (!argv["_"].length) {
    showError("script required", true);
}

try {
    var scriptProcess = executeScript();
    var inspectorProcess = startInspector();
    var browserProcess = launchBrowser();
} catch (error) {
    showError(error.message, false);
}

process.on("exit", function () {
    if (!argv["keep-alive"]) {
        if (scriptProcess) {
            scriptProcess.kill();
        }

        if (inspectorProcess) {
            inspectorProcess.kill();
        }

        if (browserProcess) {
            browserProcess.kill();
        }
    }
});

/* Shows the help message and exits with success code */
function showHelp() {
    var help = optimist.help().trim();
    console.log(help);
    process.exit(0);
}

/* Shows an error message and exits with failure code */
function showError(message, includeHelp) {
    if (includeHelp) {
        var help = optimist.help().trim();
        console.error("Error: " + message + "\n" + help);
    } else {
        console.error("Error: " + message);
    }
    
    process.exit(1);
}

/* Executes the node script */
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

/* Starts node-inspector */
function startInspector() {
    var searchPaths = [];

    switch (process.platform) {
        case "win32":
            searchPaths.push(path.join(__dirname, "..", "node_modules", ".bin", "node-inspector.cmd"));
            break;

        default:
            searchPaths.push(path.join(__dirname, "..", "node_modules", ".bin", "node-inspector"));
            break;
    }

    var inspectorPath = firstExistingPath(searchPaths);
    var inspectorArgs = [];

    inspectorArgs.push("--web-host=" + argv["web-host"]);
    inspectorArgs.push("--web-port=" + argv["web-port"]);

    return child_process.execFile(inspectorPath, inspectorArgs);
}

/* Launches a web browser (i.e. Chrome) */
function launchBrowser() {
    var searchPaths = [];

    switch (process.platform) {
        case "win32":
            searchPaths.push(path.join(process.env["LocalAppData"], "Google", "Chrome", "Application", "chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles"], "Google", "Chrome", "Application", "chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"));
            break;

        default:
            searchPaths.push(path.join("/", "opt", "google", "chrome", "google-chrome"));
            break;
    }

    var browserPath = firstExistingPath(searchPaths);
    var browserArgs = [];

    browserArgs.push("--app=http://" + argv["web-host"] + ":" + argv["web-port"] + "/debug?port=" + argv["debug-port"]);
    browserArgs.push("--user-data-dir=" + path.join(__dirname, "..", "ChromeProfile"));

    return child_process.execFile(browserPath, browserArgs);
}

/* Searches an array of paths for the first one that exists */
function firstExistingPath(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i])) {
            return paths[i];
        }
    }

    throw "file not found: " + path.basename(paths[0]);
}