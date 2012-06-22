# nodebug

This is a command-line utility that simplifies the process of debugging [node](https://github.com/joyent/node) scripts using [node-inspector](https://github.com/dannycoates/node-inspector).

## Installation

    npm install -g nodebug

## Usage

To debug a typical script:

    nodebug "lib\module.js"

To debug unit tests:

    nodebug "node_modules\nodeunit\bin\nodeunit" "test\module.js"

## What it does

1. Starts node-inspector
2. Executes the specified script with the node debugger attached
3. Launches the debugging interface in Chrome
