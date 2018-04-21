f();
require('./index.js');
f();
console.log_date = true;
f();
console.log_file = true;
f();
console.log_line = true;
f();


function f()
{
	console.log('=======================================');
	console.log("hello world");
	console.log("%%", "hello world");
	console.log("%s %o %i", "object: ", { a: 1, b: false, c: new Date() }, 2);
	console.log([1,2,3,4], { foo: 'bar' });;
	
	let a = {
		a: 1,
		b: true,
		c: null,
		d: undefined,
		e: new Promise((rs, rj) => { rs(); }),
		f: 1.0,
		g: new Date(),
		h: new Error('errormsg'),
		i: 'test',
		j: ['a', 'b', 'c', true ],
		k: 'x'.repeat(30),
	};

	a.l = a;

	console.log(a);
}

// require('./index.js');
// let v0 = { id: 0, edges: [], s: 'hello', f: false };
// let v1 = { id: 1, edges: [], e: new Error('hi') };
// let v2 = { id: 2, edges: [] };

// v0.edges.push({ src: v0, dst: v1 });
// v0.edges.push({ src: v0, dst: v2 });
// v1.edges.push({ src: v1, dst: v0 });
// v1.edges.push({ src: v1, dst: v2 });
// v2.edges.push({ src: v2, dst: v0 });
// v2.edges.push({ src: v2, dst: v1 });


// console.log(v0);
// console.log(v0);
