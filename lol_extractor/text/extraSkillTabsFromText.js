import * as tools from '../../tools/tools.js';

const CHAMPIONSAVEPATH = './data/champions/';

//TODO:
/**creates champion specific regEx and applies them on all textparts to extract unknown skillTabs
 * @param {object} championData - championData object
 * @returns {object} championData - championData object with possible new extra skillTabs
 */
export async function extraSkillTabsFromText(championData) {
	let championAbilities = championData.analysed_data.abilities;
	try {
		for (let i = 0; i < 5; i++) {
			let currentAbility = championAbilities[i];
			let textContentKeys = Object.keys(currentAbility.textContent);
			for (let contentKey of textContentKeys) {
				let currentTextContent = currentAbility.textContent[contentKey];
				let structureRegexs = createStructureRegexs(championData, currentTextContent);
				currentTextContent.foundStructures = await identifyStructure(currentTextContent, structureRegexs);
			}
		}
	} catch (err) {
		console.log(err);
		tools.bugfixing.reportError('textToSkillTab', inGameName, err.message);
	}
	return championData;
}

function identifyStructure(currentTextContent, structureRegexs) {
	/**identifies the structure of the text and marks the parts as trigger, what is empowered, with which value and what type is the emporement*/
	let text = currentTextContent.text;
	let empoweredAbilityRegexs = structureRegexs.empoweredAbilityRegexs;
	let empoweredBasicsRegexs = structureRegexs.empoweredBasicsRegexs;

	let tester_empoweredAbility = false;
	let tester_empoweredBasics = false;
	let foundRegexes = [];

	empoweredAbilityRegexs.forEach((testRegex) => {
		if (testRegex.test(text)) {
			foundRegexes.push(testRegex);
			tester_empoweredAbility = true;
		}
	});

	empoweredBasicsRegexs.forEach((testRegex) => {
		if (testRegex.test(text)) {
			tester_empoweredBasics = true;
			foundRegexes.push(testRegex);
		}
	});

	console.log('tester_empoweredAbility: \t', tester_empoweredAbility);
	console.log('tester_empoweredBasics: \t', tester_empoweredBasics);
	console.log('foundRegex: \t', foundRegexes);
	console.log(text);
	console.log();
}

/**
 * t	-	trigger
 * e	-	what is empowered
 * v	-	value and calculations for the value
 * t	-	type of emporement
 * --> its the code for the order in the found structure, i will write in capital letters what part of the structure is found
 * --> need to search for the rest
 */
function createStructureRegexs(championData, textContent) {
	/**
	 * @param {object} championData
	 * @param {object} textContent
	 *
	 */
	let inGameName = championData.name;
	4;
	let structureRegexs = {};
	let abilityTesterStatus = false;
	let inGameNameTesterStatus = false;
	let foundRegexes = [];

	/**generate searches for the emporments */
	//TODO: is empowered or empowers
	let empoweredAbilityRegexs = empoweringAbilityRegexGenerator(
		championData.scraped_data.abilitiesBorderData.abilityNames
	);
	let empoweredBasicsRegexs = empoweringBasicRegexGenerator(inGameName);

	/**generate searches for the triggers */
	/**generate searches for the values */
	/**generate searches for the empoerement types */

	structureRegexs.empoweredAbilityRegexs = empoweredAbilityRegexs;
	structureRegexs.empoweredBasicsRegexs = empoweredBasicsRegexs;
	return structureRegexs;
}

//let trigger = [`whenever ${inGameName} hits`];

function empoweringAbilityRegexGenerator(abilityNames) {
	let structuredAbilityRegex = [];
	abilityNames = tools.unifyWording.basicStringClean(abilityNames);

	abilityNames.forEach((abName) => {
		abName = `of ${abName}`;
		abName = closedStringRegexGenerator(abName, [0, 5]);
		structuredAbilityRegex.push(abName);
	});

	return structuredAbilityRegex;
}

let empoweringBasicsRegexsRaw = ['next ability', 'next auto attack', 'next basic attack'];
function empoweringBasicRegexGenerator(inGameName) {
	/** generates the basics champion concerning regexs like (inGameName) next auto attack
	 * @param {string} inGameName
	 * @return {array} basicRegexs 		array with the basic regex in it
	 */

	let basicRegexs = [];

	empoweringBasicsRegexsRaw.forEach((currentPhrase) => {
		currentPhrase = inGameName + ' empowers ' + currentPhrase;
		currentPhrase = closedStringRegexGenerator(currentPhrase, [0, 10]);
		basicRegexs.push(currentPhrase);
	});

	return basicRegexs;
}

function closedStringRegexGenerator(closedString, testRange) {
	/** takes an array or a string and generates a regex out of it which searches for the exact phrase
	 * @param {array or string} 		closedString
	 * @param {array}     				testRange 			the distanceRange between the words in the string/s
	 * @return {array or string}		generatedRegex
	 */
	let generatedRegex;
	if (Array.isArray(closedString)) {
		generatedRegex = [];
		for (let currentString of closedString) {
			let stringArray = currentString.split(' ');
			let regExString = '';
			for (let i = 0; i < stringArray.length; i++) {
				if (i != stringArray.length - 1)
					regExString += '(' + stringArray[i] + `).{${testRange[0]},${testRange[1]}}`;
				else regExString += '(' + stringArray[i] + ')';
			}
			generatedRegex.push(new RegExp(regExString, 'gim'));
		}
	} else {
		generatedRegex = '';
		let regexArray = closedString.split(' ');
		for (let i = 0; i < regexArray.length; i++) {
			if (i != regexArray.length - 1)
				generatedRegex += '(' + regexArray[i] + `).{${testRange[0]},${testRange[1]}}`;
			else generatedRegex += '(' + regexArray[i] + ')';
		}
		generatedRegex = new RegExp(generatedRegex, 'gim');
	}
	return generatedRegex;
}

function mergeWithMarkedPassages(currentTextContent, RegExAbilityNames) {
	currentTextContent.specialScalingContent.trigger = getTriggers(
		currentTextContent,
		specialContentPosition,
		RegExAbilityNames
	);
	currentTextContent.specialScalingContent.triggerRange = getTriggerRange(currentTextContent);
	currentTextContent.specialScalingContent.empowerments = getEmporements(currentTextContent);

	return currentTextContent;
}
