// Some terminals that support colors are not recognized as such
// Fortunately chalk checks an environment variable, but it must be set before requiring chalk
process.env['FORCE_COLOR'] = 'true';

let moment = require('moment-timezone');
let chalk = require('chalk');
let path = require('path');
let fs = require('fs');

// Output options
console.log_date = false;
console.log_file = false;
console.log_line = false;

console.old = console.log;

function meta()
{
	let meta = '';
	if (console.log_date)
	{
		meta += '[' + moment.tz('America/New_York').format('MM-DD HH:mm:ss') + ']';
	}
	if (console.log_file)
	{
		let caller = get_caller();
		let c = caller.file + ':';
		if (console.log_line)
		{
			c += caller.line + ':';
		}
		meta += chalk.blue(c);
	}
	return meta;
}

function map_fmt_args(fmt, args)
{
	let m = meta();

	// Convert the objects with our custom function
	args = args.map(arg =>
	{
		if (typeof arg === 'object')
		{
			let a = stringify_object(arg);
			if (a !== null)
				return a;
		}
		
		return arg;
	});

	// Replace object format specifiers
	fmt = fmt.replace(/%[oO]/g, '%s');

	if (m.length > 0)
	{
		fmt = m + ' ' + fmt;
	}

	return [fmt, ...args];
}

function map_args(fmt, args)
{
	let m = meta();

	// fmt is not a string so may need converted
	args.unshift(fmt);

	args = args.map(arg =>
	{
		if (typeof arg === 'object')
		{
			let a = stringify_object(arg);
			if (a !== null)
				return a;
		}

		return arg;
	});

	return m.length > 0 ? [m, ...args] : args;
}

console.log = function(fmt, ...args)
{
	if (typeof fmt === 'string')
		return console.old(...map_fmt_args(fmt, args));
	else
		return console.old(...map_args(fmt, args));
};

console.info = function(...args)
{
	if (typeof fmt === 'string')
		return console.old(chalk.gray(...map_fmt_args(fmt, args)));
	else
		return console.old(chalk.gray(...map_args(fmt, args)));
};

console.warn = function(...args)
{
	if (typeof fmt === 'string')
		return console.old(chalk.yellow(...map_fmt_args(fmt, args)));
	else
		return console.old(chalk.yellow(...map_args(fmt, args)));
};

console.error = function(...args)
{
	if (typeof fmt === 'string')
		return console.old(chalk.red(...map_fmt_args(fmt, args)));
	else
		return console.old(chalk.red(...map_args(fmt, args)));
};

// function to_string(value)
// {
// 	switch (typeof value)
// 	{
// 		case 'undefined': return 'undefined';
// 		case 'string': return value;
// 		case 'object':
// 			if (value == null)
// 				return 'null';
// 			if (value instanceof Promise)
// 				return 'Promise';
// 			if (value instanceof Error)
// 				return value.message;
// 			if (value instanceof Date)
// 				return value.toJSON();
// 			if (value instanceof Buffer)
// 				return 'Buffer';

// 			// Discord.js data structure
// 			if (value.constructor && value.constructor.name == 'Collection')
// 				return chalk.red('Collection[' + value.size + ']');

// 			return object_to_json(value).string;

// 		default: return value.toString();
// 	}
// }

function stringify_object(obj)
{
	let parents = [];

	let x = classify(obj, parents);
	if (x instanceof StringPrinter)
		return obj; // Print it yourself
	
	return x.stringify('\n');
}

class ObjectPrinter
{
	constructor(obj, parents)
	{
		parents.push(obj);
		this.length = 0;
		this.properties = [];

		for (let i in obj)
		{
			if (Object.hasOwnProperty.call(obj, i))
			{
				let prop = {
					key: i,
					value: classify(obj[i], parents)
				};
				this.length += prop.key.length + prop.value.length;
				this.properties.push(prop);
			}
		}

		parents.pop();
	}

	stringify(indent)
	{
		let s = '{';
		if (this.length < 40)
		{
			indent = ' ';
			s += indent;
			s += this.properties.map(p => chalk.magenta(p.key) + ': ' + p.value.stringify(indent)).join(', ');
			s += indent;
		}
		else
		{
			s += this.properties.map(p => indent + '  ' + chalk.magenta(p.key) + ': ' + p.value.stringify(indent + '  ')).join(',');
			s += indent;
		}
		return s + '}';
	}
}

class ArrayPrinter
{
	constructor(arr, parents)
	{
		parents.push(arr);
		this.length = 0;
		this.properties = [];

		for (let i = 0; i < arr.length; i++)
		{
			if (Object.hasOwnProperty.call(arr, i))
			{
				let value = classify(arr[i], parents);
				this.length += value.length;
				this.properties.push(value);
			}
		}

		parents.pop();
	}

	stringify(indent)
	{
		let s = '[';
		if (this.length < 40)
		{
			indent = ' ';
			s += indent;
			s += this.properties.map(p => p.stringify(indent)).join(', ');
			s += indent;
		}
		else
		{
			s += this.properties.map(p => indent + '  ' + p.stringify(indent + '  ')).join(',');
			s += indent;
		}
		return s + ']';
	}
}

class StringPrinter
{
	constructor(str, len)
	{
		this.string = str;
		this.length = len;
	}

	stringify(indent)
	{
		return this.string;
	}
}

// Accepts a value and returns a StringBuilder, ObjectBuilder, or ArrayBuilder based on value's type
function classify(value, parents)
{
	switch (typeof value)
	{
		case 'number': return new StringPrinter(chalk.cyan(value), String(value).length);
		case 'string':
			value = '\'' + value.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '\'';
			return new StringPrinter(chalk.yellow(value), value.length);
		case 'function': return new StringPrinter(chalk.gray('function'), 8);
		case 'undefined': return new StringPrinter(chalk.gray('undefined'), 9);
		case 'boolean':
			value = String(value);
			return new StringPrinter(chalk.red(value), value.length);
		case 'object':
			if (value === null)
				return new StringPrinter(chalk.red('null'), 4);
			if (value instanceof Promise)
				return new StringPrinter(chalk.red('Promise'), 7);
			if (value instanceof Buffer)
				return new StringPrinter(chalk.red('Buffer'), 6);
			if (value instanceof Error)
				return new StringPrinter(chalk.red('Error(' + chalk.yellow('\'' + value.message + '\'') + ')'), value.message.length + 9);
			if (value instanceof Date)
			{
				value = value.toJSON();
				if (value === null)
					return new StringPrinter(chalk.red('Invalid date'), 12);
				else
					return new StringPrinter(chalk.red(value), value.length);
			}

			// Discord.js data structure
			if (value.constructor && value.constructor.name == 'Collection')
			{
				value = 'Collection[' + value.size + ']';
				return new StringPrinter(chalk.red(value), value.length);
			}

			// Seen it before?
			let idx = parents.lastIndexOf(value);
			if (idx > -1)
			{
				let value = 'circular[^' + (parents.length-idx-1) + ']';
				return new StringPrinter(chalk.gray(value), value.length);
			}

			// Is array?
			if (Array.isArray(value))
				return new ArrayPrinter(value, parents);
			
			// Is object.
			return new ObjectPrinter(value, parents);

		default:
			value = String(value);
			return new StringPrinter(chalk.red(value), value.length);
	}
}

// Returns caller file and line number
function get_caller()
{
	try
	{
		let err = new Error();
		Error.prepareStackTrace = get_caller.hook;
		let currentfile = err.stack.shift().getFileName();
		Error.prepareStackTrace = get_caller.original;


		while (err.stack.length)
		{
			let caller = err.stack.shift();
			let file = caller.getFileName();
			// See also: caller.getFunction, caller.isNative, caller.isEval
			if (currentfile !== file)
				return { file: file ? path.basename(file) : '[internal]', line: caller.getLineNumber() };
		}
	} catch (err)
	{
		Error.prepareStackTrace = get_caller.original;
	}
}

get_caller.hook = (err, stack) => stack;
get_caller.original = Error.prepareStackTrace;