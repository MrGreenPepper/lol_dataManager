function green(string) {
	console.log(`\x1b[32m${string}\x1b[0m`);
}

function yellow(string) {
	console.log(`\x1b[33m${string}\x1b[0m`);
}
function red(string) {
	console.log(`\x1b[31m${string}\x1b[0m`);
}
function blue(string) {
	console.log(`\x1b[34m${string}\x1b[0m`);
}

module.exports = { green, yellow, red, blue };
