import * as tools from '../tools.js';
const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSpecialScaling() {
	/**specialScalings arent % ... they get in place when certain limits are cracked */
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		//	console.log('\x1b[31m', champEntry.championName, '\x1b[0m');
		console.log(champEntry.championName, '\t', champEntry.index);
		try {
			//first load the data
			let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

			/** TASKS */
			championData = await specialScalingOnMeta(championData);
			championData = await specialScalingOnChampionsPassive(championData);
			//		championData.extracted_data.baseData.abilities = await specialScalingOnActives(championData);

			//	await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_specialScaling.json`);
			//		await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
}

function specialScalingOnMeta(championData) {
	/** transforms the the special scalings in metaData to kinda 'traditional' metaSkillTabs */
	//check for specialScaling parts
	for (let i = 0; i < 5; i++) {
		let ability = championData.extracted_data.baseData.abilities[i];
		// check meta for specialScaling
		let metaKeys = Object.keys(ability.metaData);
		/**specialScaling meta */
		for (let m in metaKeys) {
			let metaData = ability.metaData[metaKeys[m]];
			if (metaData.hasOwnProperty('specialScaling')) {
				let specialKeys = Object.keys(metaData.specialScaling);
				let specialTab = {};
				/*let specialTab = [];
				if(specialKeys.length > 1) console.log('\n\n\nMORE THAN ONE SPECIALVALUE IN METADATA\n\n\n');
				for (let sKey of specialKeys) {
				let specialData = metaData.specialScaling[sKey];*/
				let specialData = metaData.specialScaling[0];
				let specialValues = specialData.botValues.split(';').map((value) => Number(value));
				let scalingType = specialData.text.slice(specialData.text.indexOf('(') + 1, specialData.text.indexOf(')')).toLowerCase();
				let scalingValue;
				if (specialData.hasOwnProperty('topValues')) {
					scalingValue = specialData.topValues.split(';').map((value) => Number(value));
					specialTab.scalingValue = scalingValue;
				}
				specialTab.specialValues = specialValues;
				specialTab.scalingType = scalingType;
				metaData.specialScaling = true;
				metaData.specialTab = specialTab;
			}
		}
	}

	//check for the specialScalingTabs in the text to confirm and sort  out possible wrong ones

	return championData;
}

function specialScalingOnChampionsPassive(championData) {
	let specialTabs = [];
	let championPassive = championData.extracted_data.baseData.abilities[0];
	let newCurrentTextContent;

	//get the abilityNames to get the skillTabs at the right part
	let abilityNames = [];
	for (let i = 0; i < 5; i++) {
		abilityNames.push(championData.extracted_data.baseData.abilities[i].name.replaceAll('_', ' ').toLowerCase());
	}
	//transfer the names to regex
	let RegExAbilityNames = abilityNames.map((abilityname) => {
		let regexArray = abilityname.split(' ');
		let regexExpr = '';
		for (let i = 0; i < regexArray.length; i++) {
			regexExpr += '(' + regexArray[i] + ').?';
		}

		regexExpr = new RegExp(regexExpr, 'i');
		return regexExpr;
	});

	let passiveTextContent = championPassive.textContent;
	let contentKeys = Object.keys(passiveTextContent);
	let currentTextContent;
	for (let key of contentKeys) {
		currentTextContent = passiveTextContent[key];

		if (currentTextContent.hasOwnProperty('specialScaling')) {
			let text = currentTextContent.text;
			/**reads out the different parts and there positions (in the normal text not the html one!!), based on there appearance
			 * the specialSkillTabs are sort to the concerning matter (trigger or emporement)
			 */
			currentTextContent.specialScalingContent = {};
			currentTextContent.specialScalingContent.tabs = getSpecialScalingTabs(
				currentTextContent.specialScaling,
				text,
				championPassive.metaData
			);
			delete currentTextContent.specialScaling;
			currentTextContent.specialScalingContent = mergeWithMarkedPassages(currentTextContent, RegExAbilityNames);
		}
	}
	//TODO: check if the special scaling is already  in the skillTab
	return championData;
}
function mergeWithMarkedPassages(currentTextContent, RegExAbilityNames) {
	let specialContentPosition = getSpecialContentPosition(currentTextContent);

	currentTextContent.specialScalingContent.trigger = getSpecialTriggers(currentTextContent, specialContentPosition, RegExAbilityNames);
	currentTextContent.specialScalingContent.triggerRange = getTriggerRange(currentTextContent);
	currentTextContent.specialScalingContent.empowerments = getEmporements(currentTextContent);

	return currentTextContent;
}

function getSpecialContentPosition(currentTextContent) {
	/**gets the position of all concerning marked passage of the specialScalingContent */
	let markedPositions = [];
	let limiterTypes = [];

	for (let specialTab of currentTextContent.specialScalingContent.tabs) {
		limiterTypes.push(specialTab.limiterType);
	}

	limiterTypes.forEach((limiterType) => {
		let position = -1;
		let limiterArray = limiterType.split(' ');
		let limiterRegex = limiterArray.reduce((regex, word) => {
			return (regex += '(' + word + ').*?');
		}, '');
		limiterRegex = new RegExp(limiterRegex, 'gim');

		currentTextContent.markedPassages.forEach((passage, index) => {
			if (limiterRegex.test(passage[0])) position = index;
		});
		if (position != -1) markedPositions.push([position, limiterType]);
		else {
			console.log('cant find position of \t', limiterType);
		}
	});
	return markedPositions;
}
function getSpecialScalingTabs(specialScalingContent, text, concerningMeta) {
	/**extracts the data from the specialDataContent and forms some kind of a 'usual' skillTab
	 *
	 * # - # (flatpart) base on (flatPartScaling) 'of the' (flatPartType)
	 *
	 * @return {Array} specialTabs - holding every skillTab with the position of it appearance
	 * 								[[skillTab], [startPosition, endPosition]]
	 */
	let specialTabs = [];

	let scalingKeys = Object.keys(specialScalingContent);
	for (let sKey of scalingKeys) {
		/*first get the extract the skillTab data*/
		let specialScalingData = specialScalingContent[sKey];
		let specialSkillTab = {};

		let scalingLimiter = []; //[[scalingPart, scalingPartType]]

		//get the flatPart
		let specialValues = specialScalingData.botValues.split(';').map((value) => Number(value));
		let limiterType = specialScalingData.text
			.slice(specialScalingData.text.indexOf('(') + 1, specialScalingData.text.indexOf(')'))
			.toLowerCase();
		let limiterValues;

		//look if the Limiter is defined especially
		if (specialScalingData.topLabel != null && limiterType == '') {
			limiterType = specialScalingData.topLabel;
			limiterType = limiterType.slice(limiterType.indexOf(']'), limiterType.length);
			limiterType = limiterType.replaceAll(']', '');
			limiterType = limiterType.trim();
		}

		if (specialScalingData.topValues != '') {
			limiterValues = specialScalingData.topValues.split(';').map((value) => Number(value));
		}

		//	specialSkillTab.concerningMeta = concerningMeta;
		if (/(level)/i.test(limiterType) && limiterValues == undefined) {
			switch (specialValues.length) {
				case 18:
					limiterValues = [...Array(18).keys()];
					break;
				case 9: //only for renata
					limiterValues = [...Array(9).keys()];
					break;
				case 15: //only for ivern
					limiterValues = [...Array(15).keys()];
					break;
				default:
					console.log(specialSkillTab);
			}
		}

		try {
			/*get the textPosition*/
			//first form the regex
			let regexArray = limiterType.split(' ');
			let regexExpr = '(' + specialValues[0] + ')[^a-zA-z]*?(' + specialValues[specialValues.length - 1] + ')';

			for (let i = 0; i < regexArray.length; i++) {
				regexExpr += '.{0,4}(' + regexArray[i] + ')';
			}

			regexExpr = new RegExp(regexExpr, 'i');
			//		console.log(regexExpr);
			let regexResult = regexExpr.exec(text);
			let startPosition = Number(regexResult.index);
			let endPosition = Number(startPosition + regexResult[0].length);

			specialSkillTab.specialValues = specialValues;
			specialSkillTab.limiterType = limiterType;
			specialSkillTab.limiterValues = limiterValues;
			specialSkillTab.position = [startPosition, endPosition];

			specialTabs.push(specialSkillTab);

			//TODO: handle the 'of the' part

			//TODO: test for 'of the' scaling-partType 'as' empowering type, 'for' when the text is in front

			//TODO: + other scalings (+ special seen renate glasc f.e. '2% per 100 ap')
		} catch (err) {
			console.log(err);
		}
	}

	//

	return specialTabs;
}
function getSpecialTriggers(currentTextContent, specialContentPositions, RegExAbilityNames) {
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

function getTriggerRange(text) {
	/**
	 * @param {string} text 	text to be analysed for trigger wwords
	 *
	 * @return {string} triggerRange
	 */
}

function getEmporements(text) {
	/**
	 * @param {string} text 	text to be analysed for trigger wwords
	 *
	 * @return {array} empoweredArray [empoweredTyp, empoweredName, empoweredPosition]
	 */
}

function connectSpecialData() {
	/** connects the specialScalings by there appearance in the text
	 * first search what is nearest to  each other, dont start with a specific category
	 */
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
	let triggerRegex = [/(stack)/i, /(resurrection)/i, /(takedown)/i, /(kills)/i, /(hits an enemy with an ability)/i, /(while below)/i];
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
