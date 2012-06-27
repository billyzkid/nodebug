#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var optimist = require("optimist");

var argv = optimist
    .usage("Usage: nodebug script.js [options]")
    .options("help", { alias: "h", boolean: true, describe: "Show this help and exit" })
    .options("port", { "default": 5858, describe: "Debug port used by node" })
    .options("web-host", { "default": "127.0.0.1", string: true, describe: "Web host used by node-inspector" })
    .options("web-port", { "default": 8080, describe: "Web port used by node-inspector" })
    .argv;

if (argv["help"] || !argv["_"].length) {
    optimist.showHelp();
    process.exit();
}

var config = {
    nodePath: getNodePath(),
    nodeArgs: [ "--debug-brk=" + argv["port"] ].concat(argv["_"]),
    nodeInspectorPath: getNodeInspectorPath(),
    nodeInspectorArgs: [ "--web-host=" + argv["web-host"], "--web-port=" + argv["web-port"] ],
    webBrowserPath: getWebBrowserPath(),
    webBrowserArgs: [ "http://" + argv["web-host"] + ":" + argv["web-port"] + "/debug?port=" + argv["port"] ]
};

function getNodePath() {
    return process.execPath;
}

function getNodeInspectorPath() {
    if (process.platform === "win32") {
        return path.join(__dirname, "..\\node_modules\\.bin\\node-inspector.cmd");
    } else {
        // TODO: support darwin, freebsd, linux, solaris, etc.
        console.error("unsupported platform");
        process.exit(1);
    }
}

function getWebBrowserPath() {
    if (process.platform === "win32") {
        var paths = [
            path.join(process.env["LocalAppData"], ".\\Google\\Chrome\\Application\\chrome.exe"),
            path.join(process.env["ProgramFiles"], ".\\Google\\Chrome\\Application\\chrome.exe"),
            path.join(process.env["ProgramFiles(x86)"], ".\\Google\\Chrome\\Application\\chrome.exe")
        ];
    } else {
        // TODO: support darwin, freebsd, linux, solaris, etc.
        console.error("unsupported platform");
        process.exit(1);
    }

    for (var i = 0, l = paths.length, p; i < l; i++) {
        p = paths[i];
        if (fs.existsSync(p)) {
            return p;
        }
    }

    console.error("web browser not found");
    process.exit(1);
}

child_process.spawn(config.nodePath, config.nodeArgs, { stdio: "inherit" }).on("exit", process.exit);
child_process.execFile(config.nodeInspectorPath, config.nodeInspectorArgs);
child_process.execFile(config.webBrowserPath, config.webBrowserArgs);
