import * as tools from './tools.js';

export async function reportError(category, inGameName, errorMessage, errorStack) {
	let errorLog = await tools.fileSystem.loadCSVData('./errorLog.csv');
	errorMessage = errorMessage.replaceAll('\n', 'N');
	errorMessage = errorMessage.replaceAll(',', '.');

	//check if error already has been logged
	let alreadyLogged = false;
	let currentErrorArray = [category, inGameName, errorMessage, errorStack];
	errorLog.map((currentElement) => {
		if (arraysEqual(currentElement, currentErrorArray)) alreadyLogged = true;
	});
	if (!alreadyLogged) errorLog.push(currentErrorArray);
	await tools.fileSystem.saveCSVData(errorLog, './errorLog.csv');
	return;
}

function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
