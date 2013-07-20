# nodebug

This is a node command line utility that simplifies the process of debugging [node](https://github.com/joyent/node) scripts using [node-inspector](https://github.com/dannycoates/node-inspector).

## Installation

    npm install -g nodebug

## Usage

To debug a typical script:

    nodebug script.js

To debug unit tests (e.g. using [nodeunit](https://github.com/caolan/nodeunit)):

    nodebug node_modules/nodeunit/bin/nodeunit tests.js

Need to pass options to your script?

	nodebug script.js -- -v -t --include who

[Optimist](https://github.com/substack/node-optimist), which powers nodebug's options, allows for any arguments after the `--` to remain untouched.

## What it does

1. Executes the specified script with the node debugger attached (i.e. --debug-brk)
2. Starts node-inspector
3. Launches the debugging interface (i.e. Chrome)
