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
    .options("keep", { "default": false, describe: "Keep (do not kill) the inspector and browser processes on script completion" })
    .argv;

if (argv["help"]) {
    showHelp();
}

if (!argv["_"].length) {
    showError("script required", true);
}

var scriptChild = executeScript();
var inspectorChild = startNodeInspector();
var browserChild = launchWebBrowser();

process.on('exit', function(){
    // kill children if they exist
    if( ! argv['keep'] ){
        scriptChild.kill();
        inspectorChild.kill();
        browserChild.kill();
    }
})

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
    var nodeInspectorPath = firstThatExists( ['node-inspector'] )
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
            searchPaths.push(path.join(process.env["LocalAppData"], ".", "Google", "Chrome", "Application", "chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles"], ".", "Google", "Chrome", "Application", "chrome.exe"));
            searchPaths.push(path.join(process.env["ProgramFiles(x86)"], ".", "Google", "Chrome", "Application", "chrome.exe"));
            break;

        case "darwin":
            searchPaths.push( path.join("/", "Applications", "Google Chrome.app", "Contents", "MacOS", "Google Chrome") );
            break;

        default:
            searchPaths.push( path.join("/", "opt", "google", "chrome", "google-chrome") );
            break;
    }

    webBrowserPath = firstThatExists( searchPaths );

    var webBrowserArgs = [];
    webBrowserArgs.push( '--user-data-dir=' + path.join(__dirname, '..', 'ChromeProfile') );
    webBrowserArgs.push( '--app=http://' + argv["web-host"] + ":" + argv["web-port"] + "/debug?port=" + argv["debug-port"] );

    return child_process.execFile(webBrowserPath, webBrowserArgs);
}

function firstThatExists( paths ){

    if( !paths.splice ) paths = [ paths ];

    paths.filter(function(path){
        if( fs.existsSync(path) ){
            return path;
        }
    })

    if( paths.length ){
        return paths.pop();
    } else {
        throw Error('Could not find required file: ' + path.basename( paths[0] ))
    }
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
