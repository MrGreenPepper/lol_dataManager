export function getTriggerRange(text) {
	/**
	 * @param {string} text 	text to be analysed for trigger wwords
	 *
	 * @return {string} triggerRange
	 */
}

export function getTriggers(currentTextContent, specialContentPositions, RegExAbilityNames) {
	/** searches in front of the specialScalingContent for a trigger word in the markedPassages
	 * @param {object} currentTextContent
	 * @param {array} specialContentPosition
	 * @param {array with regexExpr} RegExAbilityNames
	 *
	 * @return {array} triggerArray [[trigger, triggerPosition]]
	 */
	let markedPassages = currentTextContent.markedPassages;
	let triggerOrigins = ['basic attack', 'kill', 'champion takedown', 'damage an champion'];
	let triggerArray = [];
	let foundTriggers = [];
	let triggerRange = ['abilities stack', 'basic attack stack'];
	//generete regex from triggerArray
	triggerArray = triggerOrigins.map((wordComb) => {
		let triggerWordArray = wordComb.split(' ');
		triggerWordArray = triggerWordArray.reduce((regex, word) => {
			return (regex += '(' + word + ').*?');
		}, '');
		let regex = new RegExp(triggerWordArray, 'gim');
		return regex;
	});

	//search in the markedPassages for the right trigger
	for (let specialPosition of specialContentPositions) {
		for (let i = specialPosition[0] - 1; i >= 0; i--) {
			let markedPassagsPhrase = markedPassages[i][0];
			let triggerBool = false;
			triggerArray.forEach((trigger) => {
				if (trigger.test(markedPassagsPhrase) && triggerBool == false) {
					foundTriggers.push(trigger);
					triggerBool = true;
				}
			});
		}
	}

	//if not all triggers found yet, search the text for it
	if (foundTriggers.length != specialContentPositions.length) {
		for (let specialPosition of specialContentPositions) {
			let conceringMarkedPassages = markedPassages[specialPosition[0]];
			let triggerText = currentTextContent.text.slice(0, conceringMarkedPassages[1]);
			let possibleMatches = [];
			triggerArray.forEach((trigger) => {
				if (trigger.test(triggerText)) possibleMatches.push(trigger);
			});
			if (possibleMatches.length == 1) foundTriggers.push(possibleMatches[0]);
			if (possibleMatches.length > 1) {
				//search for the trigger which is next to the specialScaling
				console.log('multiple possible triggers found');
			}
		}
	}

	if (foundTriggers.length != specialContentPositions.length) {
		console.log('not all triggers found');
		console.log(specialContentPositions);
		console.log(markedPassages);
		console.log(triggerArray);
		//TODO: akali 'swinging Kama'
	}
	return triggerArray;
}
