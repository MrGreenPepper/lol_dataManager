export function getEmporements(text) {
	/**
	 * @param {string} text 	text to be analysed for trigger wwords
	 *
	 * @return {array} empoweredArray [empoweredTyp, empoweredName, empoweredPosition]
	 */
}

function empoweringBasicRegexGenerator(inGameName) {
	inGameName = tools.unifyWording.basicStringClean(inGameName);
	let structureRegexs = [];
	structureRegexs.push(`${inGameName}.{0,20}gains`);
	structureRegexs.push(`${inGameName}.{0,6}is empowered`);
	structureRegexs.push(`(${inGameName}).{0,6}(empowers).{0,6}(his)|(her).{0,6}`);

	structureRegexs = structureRegexs.map((regexString) => new RegExp(regexString, 'gim'));
	return structureRegexs;
}

function analyseTextForEmpowerments(toAnalyseHTML, toAnalyseText, abilityNamesRegex) {
	/** analyses the text for keywords and sets a connection to the concerning specialScalings-skillTabs
	 *
	 * @param {String} toAnalyseText the text to be analysed - the html version
	 * @param {Array} abilityNamesRegex the ablityNames in regex to search for in the current text for to get the empowerements
	 *
	 * @return {Object} foundEmpowers - {trigger: 		[]
	 * 									triggerRange:	next/always/
	 * 									empoweredType:	all, one, #number
	 * 									empowerments:	[empoweredTyp, empoweredName, (empoweredPosition)]}
	 */
	let foundEmpowers = [];
	let triggerRegex = [
		/(stack)/i,
		/(resurrection)/i,
		/(takedown)/i,
		/(kills)/i,
		/(hits an enemy with an ability)/i,
		/(while below)/i,
	];
	let triggerRange;
	let empoweredType;

	//test for triggerRange
	switch (true) {
		case /(next)/i:
			triggerRange = 'one';
			break;
		case /(permanent)/i:
			triggerRange = 'always';
	}

	//check if multiple abilityNames appears
	abilityNamesRegex.forEach((abilityName, index) => {
		if (abilityName.test(toAnalyseHTML)) foundEmpowers.push(['ability', abilityName, index]);
	});

	let empoweredBasicRegex = [
		/(basic).*?(attack)/i,
		/(heal).*?(herself)/i,
		/(heal).*?(himself)/i,
		/(heals).*?(for)/i,
		/(regenerate)/i,
		/(bonus).*?(movement).*?(speed)/i,
		/(bonus).*?(armor)/i,
		/(bonus).*?(magic).*?(resistance)/i,
		/(bonus).*?(attack).*?(speed)/i,
	];
	empoweredBasicRegex.forEach((keyRegex, index) => {
		if (keyRegex.test(toAnalyseHTML)) foundEmpowers.push(['basics', keyRegex, index]);
	});
	//TODO: test for 'or' and 'and' between the empoweredParts
	if (foundEmpowers.length == 0) {
		console.log('no concerning empowerement found');
	}
	if (foundEmpowers.length > 1) {
		switch (true) {
			case /(and)/i.test(toAnalyseHTML):
				empoweredType = 'all';
				break;
			case / (or) /i.test(toAnalyseHTML):
				empoweredType = 'one';
				break;
		}
		if (empoweredType == undefined) {
			console.log('more than one concerning empowerement found and no typeConnecter found');
		}
	}
	return foundEmpowers;
}
