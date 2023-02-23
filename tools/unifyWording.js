export function basicStringClean(toCleanUp) {
	let cleanedString;
	if (Array.isArray(toCleanUp)) {
		cleanedString = [];
		for (let rawString of toCleanUp) {
			rawString = rawString.toLowerCase();
			rawString = rawString.replaceAll('−', '-');
			rawString = rawString.replaceAll('」', ' ');
			rawString = rawString.replaceAll('「', ' ');
			rawString = rawString.replaceAll(/\n/gim, ' ');
			rawString = rawString.replaceAll('  ', ' '); //doubleSpace
			rawString = rawString.replaceAll('	', ' '); //tab
			rawString = rawString.replaceAll('_', ' '); //tab
			rawString = rawString.trim();
			cleanedString.push(rawString);
		}
	} else {
		toCleanUp = toCleanUp.toLowerCase();
		toCleanUp = toCleanUp.replaceAll('−', '-');
		toCleanUp = toCleanUp.replaceAll('」', ' ');
		toCleanUp = toCleanUp.replaceAll('「', ' ');
		toCleanUp = toCleanUp.replaceAll(/\n/gim, ' ');
		toCleanUp = toCleanUp.replaceAll('  ', ' '); //doubleSpace
		toCleanUp = toCleanUp.replaceAll('	', ' '); //tab
		toCleanUp = toCleanUp.replaceAll('_', ' '); //tab
		toCleanUp = toCleanUp.trim();
		cleanedString = toCleanUp;
	}
	return cleanedString;
}
/* has became superfluous since using tools.dataSet.createIdentifier() as fileNames also still keeping it for later use
export function fileSystemNameConverter(itemName) {
	try {
		//TODO:

		itemName = itemName.replaceAll(' ', '');
		itemName = itemName.replaceAll('"', '');
		itemName = itemName.replaceAll("'", '');
		itemName = itemName.replaceAll("'", '');
	} catch (err) {
		console.log(err);
		reportError('cant modify itemName', itemName, err.message, err.stack);
	}
	return itemName;
}*/

export function toBasicRegex(wordComb) {
	/**tests if the input as an array or a single string --> everything to regex --> returns array or string */
	let regexExpr;
	if (Array.isArray(wordComb)) {
		regexExpr = [];
		for (let currentWord of wordComb) {
			let regexArray = currentWord.split(' ');
			let regExString = '';
			for (let i = 0; i < regexArray.length; i++) {
				regExString += '(' + regexArray[i] + ').*?';
			}

			regexExpr.push(new RegExp(regExString, 'gim'));
		}
	} else {
		let regexArray = wordComb.split(' ');
		regexExpr = '';
		for (let i = 0; i < regexArray.length; i++) {
			regexExpr += '(' + regexArray[i] + ').*?';
		}

		regexExpr = new RegExp(regexExpr, 'gim');
	}
	return regexExpr;
}
