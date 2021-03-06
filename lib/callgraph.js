

exports.parse = parse;
exports.print = print;

function parse (tree, options) {
	CallGraph.init(options['target']);
	var target = CallGraph.findTarget(tree);
	return CallGraph.getMethods(CallGraph.getProperties(target));
};

function print (methods, target) {
	var attribute;
	console.log('digraph G {');
	console.log('  graph[rankdir=LR,ranksep=1.3]');
	console.log('  node[shape=box]');
	for (var i = 0; i < methods.length; i++) {
		console.log('  "' + methods[i]['name'] + '";');
	}
	for (var i = 0; i < methods.length; i++) {
		for (key in methods[i].callee) {
			if (methods[i].callee[key] > 1) {
				 attribute =' [label = "' + methods[i].callee[key] + '"]';
			}
			else {
				attribute = '';
			}
			console.log('  "' + methods[i]['name'] + '" -> "' + key + '"' + attribute + ';');
		}
	}
	console.log('}');
};

var CallGraph = {
	target: null,

	init: function cg_init(target) {
		this.target = target;
	},

	findTarget: function cg_findTarget(tree) {
		var result = null;
		if (!tree ||
			typeof(tree) === 'boolean' ||
		    typeof(tree) === 'string' ||
		    typeof(tree) === 'number') {
			return null;
		} else if (tree['type'] === 'VariableDeclarator' && 
				   tree['id']['type'] === 'Identifier' &&
				   tree['id']['name'] === this.target) {
			result = tree['init'];
		} else if (Array.isArray(tree)) {
			for (var i = 0; i < tree.length; i++) {
				result = this.findTarget(tree[i], this.target);
				if (result)
					break;
			}
		} else {
			for (var prop in tree) {
				result = this.findTarget(tree[prop], this.target);
				if (result != null)
					break;
			}
		}
		return result;
	},

	getProperties: function cg_getProperties(tree) {
		if (tree.type === 'CallExpression') {
			return tree.callee.body.body;
		}
		else if (tree.type === 'ObjectExpression') {
			return tree.properties;
		}
	},

	getMethods: function cg_getMethods(list) {
		var result = [], method, i;
		for (i = 0; i < list.length; i++) {
			if (list[i].type === 'FunctionDeclaration') {
				method = {'name': list[i].id.name,
						  'callee':  this.getCallee(list[i].body.body, list[i].params)};
				result.push(method);
			} else if (list[i].type === 'Property' &&
					   list[i].value.type === 'FunctionExpression') {
				method = {'name': list[i].key.name,
						  'callee': this.getCallee(list[i].value.body.body, list[i].value.params) };
				result.push(method);
			}
		}
		return result;
	},

	getCallee: function cg_getCallee(tree, params) {
		var result = {}, i;
		if (!tree ||
			typeof(tree) === 'boolean' ||
		    typeof(tree) === 'string' ||
		    typeof(tree) === 'number') {
			return result;
		} else if (tree.type && tree.type === 'CallExpression') {
			if (tree.callee.object && tree.callee.object.type === 'ThisExpression') {
				result[tree.callee.property.name] = 1;
			} else if (!tree.callee.object) {
				if (params && params.some(function(el) { return (tree.callee.name === el.name); })) {
					return result;
				}
				result[tree.callee.name] = 1;
			} else if (tree.callee.object && tree.callee.object.name === this.target) {
				result[tree.callee.property.name] = 1;
			}
		} else if (Array.isArray(tree)) {
			for (i = 0; i < tree.length; i++) {
				this.count(result, this.getCallee(tree[i], params));
			}
		} else {
			for (var prop in tree) {
				this.count(result, this.getCallee(tree[prop], params));
			}
		}
		return result;
	},

	count: function cg_count(result, ret) {
		for (key in ret) {
			if (result[key] !== undefined)
				result[key]++;
			else
				result[key] = 1;
		}
	}
};
