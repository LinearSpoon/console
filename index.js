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
		if (typeof arg === 'object' && arg !== null)
			return object_to_json(arg).string;
		else
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
		if (typeof arg === 'object' && arg !== null)
			return object_to_json(arg).string;
		else
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

function to_json(value, format)
{
	switch (typeof value)
	{
		case 'undefined': return { string: chalk.gray('undefined'), length: 9 };
		case 'number': return { string: chalk.cyan(value), length: value.toString().length };
		case 'string':
			value = '\'' + value.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '\'';
			return { string: chalk.yellow(value), length: value.length };
		case 'function': return { string: chalk.gray('function'), length: 8 };
		case 'boolean':
			value = value.toString();
			return { string: chalk.red(value), length: value.length };
		case 'object':
			if (value === null)
				return { string: chalk.red('null'), length: 4 };
			if (value instanceof Promise)
				return { string: chalk.red('Promise'), length: 7 };
			if (value instanceof Buffer)
				return { string: chalk.red('Buffer'), length: 6 };
			if (value instanceof Error)
				return { string: chalk.red('Error(' + chalk.yellow('\'' + value.message + '\'') + ')'), length: value.message.length + 9 };
			if (value instanceof Date)
			{
				value = value.toJSON();
				if (value === null)
					return { string: chalk.red('Invalid date'), length: 12 };
				else
					return { string: chalk.red(value), length: value.length };
			}

			// Discord.js data structure
			if (value.constructor && value.constructor.name == 'Collection')
			{
				value = 'Collection[' + value.size + ']';
				return { string: chalk.red(value), length: value.length };
			}

			return object_to_json(value, format);

		default:
			value = value.toString();
			return { string: chalk.red(value), color: value.length };
	}
}

function object_to_json(object, format)
{
	// expanded format will be used if the string exceeds this many characters
	const always_extended_limit = 90;
	// short format will be used if the string is less than this many characters
	const always_short_limit = 30;

	// Tracks parents and current indent level
	if (!format)
		format = { parents: [], indent: 2 };

	// Check if we have visited this object already
	if (format.parents.indexOf(object) != -1)
		return { string: chalk.gray('circular'), length: 8 };

	format.parents.push(object);

	let string = '';
	let length = 0;

	if (Array.isArray(object))
	{
		// Generate a condensed array string
		string = '[ ';
		length = 2;
		for (let i = 0; i < object.length; i++)
		{
			if (Object.hasOwnProperty.call(object, i))
			{
				let json = to_json(object[i], format);

				length += json.length + 2;
				if (format.indent + length > always_extended_limit && length > always_short_limit)
					break;
				string += json.string + ', ';
			}
		}

		string = string.replace(/,?\s*$/, ' ]');
	}
	else
	{
		// Generate a condensed object string
		string = '{ ';
		length = 2;
		for (let i in object)
		{
			if (Object.hasOwnProperty.call(object, i))
			{
				let json = to_json(object[i], format);

				length += i.toString().length + json.length + 4;
				if (format.indent + length > always_extended_limit && length > always_short_limit)
					break;
				string += chalk.magenta(i) + ': ' + json.string + ', ';
			}
		}

		string = string.replace(/,?\s*$/, ' }');
	}

	// Did we stop because the condensed string became too long?
	if (format.indent + length > always_extended_limit && length > always_short_limit)
	{
		let indent = '\n' + ' '.repeat(format.indent);
		format.indent += 2;

		if (Array.isArray(object))
		{
			// Generate an expanded array string
			string = '[';
			for (let i = 0; i < object.length; i++)
			{
				if (Object.hasOwnProperty.call(object, i))
				{
					let json = to_json(object[i], format);
					string += indent + json.string + ',';
				}
			}

			string = string.replace(/,?$/, indent.slice(0, -2) + ']');
		}
		else
		{
			// Generate an expanded object string
			string = '{';
			for (let i in object)
			{
				if (Object.hasOwnProperty.call(object, i))
				{
					let json = to_json(object[i], format);
					string += indent + chalk.magenta(i) + ': ' + json.string + ',';
				}
			}

			string = string.replace(/,?$/, indent.slice(0, -2) + '}');
		}

		format.indent -= 2;
	}

	format.parents.pop();
	return { string, length };
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
