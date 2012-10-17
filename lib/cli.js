#!/usr/bin/env node

var esprima = require('esprima');
var fs = require('fs');
var content, syntax, fname, target, args, options;
var cg = require('./callgraph');

function showUsage() {
	console.log('Usage:');
	console.log('  jcg <file.js> OBJECT_NAME');
	console.log('  e.g. jcg window_manager.js WindowManager');
	process.exit(1);
}

if (process.argv.length <= 3) {
	showUsage();
}

args = process.argv.slice(2);

fname = args.shift();
options = {'target': args.shift()};

try {
	content = fs.readFileSync(fname, 'utf-8');
	syntax = esprima.parse(content);
	var result = cg.parse(syntax, options);
	cg.print(result);

} catch (e) {
	console.log('Error: ' + e.message);
	process.exit(1);
}