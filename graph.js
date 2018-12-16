class LazyGraph {
	receiveGraph(graph) {
		// ugly toString + regex :(
		function getArgs(func) {
			var args = func.toString().match(/\(([^)]*)\)/)[1];
			return args.split(',').map(function(arg) {
				return arg.replace(/\/\*.*\*\//, '').trim();
			}).filter(Boolean);
		}
		// creating graphs for estimation support
		// {vertex : function}
		this.graph = graph;
		// graph with answers = {vertex : answer}
		this.ansGraph = {...graph};
		// graph with arguments of corresponding functions {vertex : [conected vertices keys]}
		this.argsGraph = {...graph};
		for (var prop in this.graph) {
			this.argsGraph[prop] = getArgs(this.graph[prop]);
			// assigning vertex value if function has no param
			if (this.argsGraph[prop].length == 0){
				this.ansGraph[prop] = this.graph[prop]();
			} else {
				this.ansGraph[prop] = undefined;
			}
		}
		return this;
	}


	calcVertex(vertexName) {
		// {vertex : true} if algorith was here
		this.flagGraph = {...this.graph};
		for (var prop in this.graph) {
			this.flagGraph[prop] = false;
		}

		function solver(key, depth) {
			// if value of this vertex is estimated => return it
			if(typeof this.ansGraph[key] !== "undefined"){
				return this.ansGraph[key];
			} else {
				// if this vertex is visited catching cycle error
				if (this.flagGraph[key]){
					// deep search
					let loopSearch = function(currentVert, trace, toSearch){
						// if we came to initial vertex => error with trace
						if (trace.length != 0 && currentVert === toSearch) {
							throw new Error("Loop " + trace.join(" -> "));
						}
						else {
							for (let i = 0; i < this.argsGraph[currentVert].length; i++){
								let v = this.argsGraph[currentVert][i];
								trace.push(currentVert);
								loopSearch.call(this, v, trace, toSearch);
								trace.pop();
							}
						}
					}
					loopSearch.call(this, key, [], key, 0);
				} else {
					this.flagGraph[key] = true;
				}
			}
			// if we have function without arguments => return its output
			if (this.argsGraph[key].length == 0){
				return this.graph[key]();
			} else {
				var argums = [];
				// contain values of function arguments in array
				for (let i = 0; i < this.argsGraph[key].length; i++) {
					let argument = this.argsGraph[key][i];
					// recursive call if argument is undefined
					this.ansGraph[argument] = solver.call(this, argument, depth + 1);
					argums.push(this.ansGraph[argument]);
				}
				// estimation of required vertex (argument)
				return this.graph[key].apply(this, argums);
			}
		}
		let estimatedVertex = solver.call(this, vertexName, 0);
		// console.log(vertexName, "=", estimatedVertex)
		return estimatedVertex;
	}
}

const myAmazingGraph = {
  n: (xs) => xs.length,
  m: (xs, n) => xs.reduce((store, item) => item + store, 0) / n,
  m2: (xs, n) => xs.reduce((store, item) => item * store, 1) / n,
  v: (m, m2) => m*m - m2,
  xs: () => [1, 2, 3]
}

// test lazy
console.log("Lazy test (correct graph):")
console.log((new LazyGraph()).receiveGraph(myAmazingGraph).calcVertex('n'))


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
		return this.ansGraph[vertexName];
	}
}

// test eager
console.log("Eager test (correct graph):")
console.log((new EagerGraph()).receiveGraph(myAmazingGraph).calcVertex('m2'))

const myLoopedGraph = {
	a: () => 1,
	b: (z) => z,
	z: (x) => x,
	x: (b) => b
};

console.log("Eager/lazy test (cecle dependency):")
console.log((new EagerGraph()).receiveGraph(myLoopedGraph).calcVertex('x'))