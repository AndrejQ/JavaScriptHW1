class LazyGraph {
	receiveGraph(graph) {
		// ugly toString + regex :(
		function getArgs(func) {
			var args = func.toString().match(/\(([^)]*)\)/)[1];
			return args.split(',').map(function(arg) {
				return arg.replace(/\/\*.*\*\//, '').trim();
			}).filter(function(arg) {
				return arg;
			});
		}
		// creating graphs for estimation support
		// {vertex : function}
		this.graph = graph;
		// graph with answers = {vertex : answer}
		this.ans_graph = Object.assign({}, graph);
		// graph with arguments of corresponding functions {vertex : [conected vertices keys]}
		this.args_graph = Object.assign({}, graph);
		for (var prop in this.graph) {
			this.args_graph[prop] = getArgs(this.graph[prop]);
			// assigning vertex value if function has no param
			if (this.args_graph[prop].length == 0){
				this.ans_graph[prop] = this.graph[prop]();
			} else {
				this.ans_graph[prop] = undefined;
			}
		}
		return this;
	}


	calcVertex(vertexName) {
		function solver(key, depth) {
			// if value of this vertex is estimated => return it
			if(typeof this.ans_graph[key] !== "undefined"){
				return this.ans_graph[key];
			}
			// catching cycle error
			if (depth > Object.keys(this.graph).length){
				throw new Error('Cycle!!!');
			}
			// if we have function without arguments => return its output
			if (this.args_graph[key].length == 0){
				return this.graph[key]();
			} else {
				var argums = [];
				// contain values of function arguments in array
				for (let i = 0; i < this.args_graph[key].length; i++) {
					let argument = this.args_graph[key][i];
					// recursive call if argument is undefined
					this.ans_graph[argument] = solver.call(this, argument, depth + 1);
					argums.push(this.ans_graph[argument]);
				}
				// estimation of required vertex (argument)
				return this.graph[key].apply(this, argums);
			}
		}
		let estimated_vertex = solver.call(this, vertexName, 0);
		// console.log(vertexName, "=", estimated_vertex)
		return estimated_vertex;
	}
}


const myAmazingGraph = {
  n: (xs) => xs.length,
  m: (xs, n) => xs.reduce((store, item) => item + store, 0) / n,
  m2: (xs, n) => xs.reduce((store, item) => item * store, 1) / n,
  v: (m, m2) => m*m - m2,
  xs: () => [1, 2, 3]
};

// test lazy
console.log((new LazyGraph()).receiveGraph(myAmazingGraph).calcVertex('m2'))


// ====================

class EagerGraph extends LazyGraph {
	receiveGraph(graph) {
		super.receiveGraph(graph);
		for (let vertex in this.graph) {
			super.calcVertex(vertex);
		}
		return this;
	}
	calcVertex(vertexName) {
		return this.ans_graph[vertexName];
	}
}

// test eager
console.log((new EagerGraph()).receiveGraph(myAmazingGraph).calcVertex('m2'))
