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