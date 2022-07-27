import * as extractorTools from './extractorTools.js';
import * as tools from '../tools.js';
import * as markerTools from './marker/markerTools.js';
import * as cleaner from './cleaner.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSkillTabs() {
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		//	console.log('\x1b[31m', champEntry.championName, '\x1b[0m');
		console.log(champEntry.championName, '\t', champEntry.index);
		try {
			//first load the data
			let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

			/** TASKS */
			championData = await extractSkillTabs(championData);
			championData.extracted_data.baseData.abilities = await createSkillTabArrays(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillTabs.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
}

export async function extractSkillTabs(championData) {
	/** Extracts all skillTabs from a Champion, nether the less how many there are and divide it into markers % mathData (--> divideSkillTabs())
	 *
	 * @param   championData    the complete champion data,
	 *
	 * @returns championData    the same as input but with extracted skilltabs into markers and mathData
	 */
	//get the abilitynumbers first

	let championAbilities = championData.extracted_data.baseData.abilities;
	let abilityKeys = Object.keys(championAbilities);
	let abilityNumbers = abilityKeys.reduce((acc, element) => {
		if (/[0-9]/g.test(element)) acc++;
		return acc;
	}, 0);

	for (let abNum = 0; abNum < abilityNumbers; abNum++) {
		//console.log('textContent SkillTabs:');
		let textContentCount = Object.keys(championAbilities[abNum].textContent);
		for (let textNum = 0; textNum < textContentCount.length; textNum++) {
			//empty != undefined
			if (championAbilities[abNum].textContent[textNum].skillTabs != undefined) {
				let textContentSkillTabCount = Object.keys(championAbilities[abNum].textContent[textNum].skillTabs);
				for (let sTNum = 0; sTNum < textContentSkillTabCount.length; sTNum++) {
					championAbilities[abNum].textContent[textNum].skillTabs[sTNum] = await divideSkillTabs(
						championAbilities[abNum].textContent[textNum].skillTabs[sTNum]
					);
				}
			}
		}
	}

	//debugger;

	return championData;
}

async function divideSkillTabs(skillTab) {
	//skillTab.content == undefined if already extracted
	if (skillTab == undefined || skillTab == '' || skillTab.content == undefined) {
		return skillTab;
	}

	skillTab.content = skillTab.content.toLowerCase();
	skillTab.marker = skillTab.marker.toLowerCase();
	let skillTabContentRaw = [];
	let skillTabContent = {};

	//TODO: some markers are the same but have multiple wordings --> simplify it later : 'bonus movement speed' & 'movement speed modifier'
	let markers_modifier = ['enhanced', 'sweetspot', 'maximum', 'total', 'empowered', 'minimum', 'per'];
	let markers_dmg = [
		'physical damage',
		'magic damage',
		'armor reduction',
		'magic penetration',
		'bonus attack speed',
		"of target's  health",
		"of target's  th",
		'of his missing th',
		"of the target's current th",
	];
	let markers_def = ['heal', 'shield', 'bonus armor'];
	let markers_utility = [
		'stun duration',
		'knock up duration',
		'charm duration',
		'root duration',
		'blind duration',
		'bonus movement speed',
		'movement speed modifier',
		'slow',
		'stealth duration',
	];
	//TODO
	let markers_bonusStats = ['reset', 'energy restored', 'mana refund'];
	let markers = [];
	markers.push(...markers_dmg, ...markers_def, ...markers_utility);

	// divide into markers and math -- old not needed anymore with the new sracer
	//   skillTabContentRaw = await divideIntoMarkerAndMath(skillTab);

	//cleanup text & math ... extract single math numbers from text

	skillTabContent = {};
	let temp = [];
	let tab = [];
	tab.push(skillTab.marker);
	tab.push(skillTab.content);
	skillTabContent.origin = tab;
	skillTab.marker = cleaner.cleanText(skillTab.marker);

	skillTab.content = skillTab.content.replace(/\:/g, '');
	skillTab.content = await divideMathFromSkillTabs(skillTab.content);

	skillTab.content = await cleaner.cleanMathContent(skillTab.content);

	skillTabContent.marker = skillTab.marker;
	skillTabContent.math = skillTab.content;
	//   console.table(skillTabContent);
	//console.log('dividedcontent:');
	//console.log(skillTabContent);
	//debugger;

	return skillTabContent;
}

function identifyMathPart(skillTab, startPosition) {
	return new Promise((resolve) => {
		let status;
		let special = false;
		//first if there is a pair of quotationMarks before the next seperator(':')

		for (let i = startPosition + 1; i < skillTab.length; i++) {
			if (special == true) {
				switch (status) {
					case '»':
						if (skillTab[i] == '«') {
							special = false;
							mathPart = skillTab.slice(startPosition, i);
							return resolve([mathPart, i]);
						}
						break;
					case '(':
						if (skillTab[i] == ')') {
							special = false;
						}
						break;
				}
			} else {
				switch (skillTab[i]) {
					case '(':
						status = '(';
						special = true;
						break;
					case '»':
						status = '»';
						special = true;
						break;
					case ':':
						console.log('Error - no mathPart end found at the right time:\n', skillTab);
						break;
					default:
						if (!extractorTools.firstSeperation_isItMath(skillTab[i])) {
							mathPart = skillTab.slice(startPosition, i);
							return resolve([mathPart, i]);
						}
				}
			}

			if (i + 1 == skillTab.length) {
				mathPart = skillTab.slice(startPosition, i + 1);
				return resolve([mathPart, i]);
			}
		}
	});
}

async function divideIntoMarkerAndMath(skillTabOrigin) {
	/**
	 * @returns {array} [markerPart, mathPart]
	 */
	let skillTab = skillTabOrigin;
	let partStartPosition = 0;
	let markerPart;
	let seperatorPosition = 0;
	let openBracketsCount = 0;
	let mathPartContent;
	let skillTabContent = [];
	//before every ':' is the markerPart after is the mathPart
	/**loop threw skillTab for ':'
	 * everything before ':' is the markerPart
	 * everything after ':' needs a quotationMark test, if True slice the hole part out
	 * ignore brackets
	 * when text begins again slice mathPart to this Position
	 *
	 */
	for (let i = 0; i < skillTab.length; i++) {
		if (skillTab[i] == '(') {
			openBracketsCount++;
		}
		if (skillTab[i] == ')') {
			openBracketsCount--;
		}

		if (openBracketsCount == 0) {
			if (skillTab[i] == ':') {
				seperatorPosition = i;
				markerPart = skillTab.slice(partStartPosition, seperatorPosition);
				mathPartContent = await identifyMathPart(skillTab, i);
				mathPart = mathPartContent[0];

				i = mathPartContent[1];
				skillTabContent.push([markerPart, mathPart]);
				partStartPosition = i;
			}
		}
	}

	skillTabContentRaw = skillTabContent;

	// at the end test if all is exported by deleting all known content and test if the rest is empty
	testContent = skillTabOrigin;
	for (let testIndex = 0; testIndex < skillTabContentRaw.length; testIndex++) {
		testContent = testContent.replace(/undefined/g, '');
		testContent = testContent.replace(skillTabContentRaw[testIndex][0], '');
		testContent = testContent.replace(skillTabContentRaw[testIndex][1], '');
	}

	testContent = testContent.replace(/\//g, '');

	testContent = testContent.replace(/\)/g, '');
	testContent = testContent.trim();

	if (testContent.length > 0) {
		console.error('\x1b[31m\t divideIntoMarkerAndMath - critical content divergence  \x1b[0m');
		console.log('origin skillTab: \t', skillTab);
		console.log('missing part:\t\t', testContent);
		console.log('content before correction: \t');
		//console.table(skillTabContentRaw);
		//change last entry

		let lastEntryIndex = skillTabContentRaw.length - 1;
		skillTabContentRaw[lastEntryIndex][1] = skillTabOrigin.slice(seperatorPosition);
		//console.table('content after correction: \t');
		//console.table(skillTabContentRaw);
	}

	// now clean the content after its valuation
	for (let i = 0; i < skillTabContent.length; i++) {}
	return skillTabContent;
}

async function getScalingPositions(originSkillTabMath) {
	/**extract raw scalingPart for later dividing */
	// get the scaling parts positions in the brackets
	let scalingPartPositions = [];
	let scalingParts = 0;
	let scalingBrackets = 0;
	let scalingScale = [];
	let lastPosition = 0;
	for (let i = 0; i < originSkillTabMath.length; i++) {
		if (originSkillTabMath[i] == '(' && scalingBrackets > 0) {
			scalingScale.push(i);
			scalingBrackets++;
			scalingParts++;
		}
		if (originSkillTabMath[i] == '(' && scalingBrackets == 0) {
			lastPosition = i;
			scalingBrackets++;
		}
		if (originSkillTabMath[i] == ')' && scalingBrackets == 1) {
			scalingPartPositions.push([lastPosition, i]);
			//check if extra scaling (in most cases max life scaling with extra % for stacks/ap/ad)
			if (scalingScale.length > 1) {
				scalingPartPositions[scalingPartPositions.length - 1].push(scalingScale);
			}
			scalingParts++;
			scalingBrackets--;
		}
		if (originSkillTabMath[i] == ')' && scalingBrackets > 1) {
			scalingScale.push(i);
			scalingParts++;
			scalingBrackets--;
		}
		if (i + 1 == originSkillTabMath.length && scalingBrackets > 0) {
			scalingPartPositions.push([lastPosition, i + 1]);
			scalingParts++;
		}
	}
	return scalingPartPositions;
}
async function divideScalingPart(rawScalingPart) {
	let subScaArray = [];
	let scalingType;
	// cleanup the scalingPart content for dividing
	rawScalingPart = rawScalingPart.replace(/\(/g, '');
	rawScalingPart = rawScalingPart.replace(/\)/g, '');
	rawScalingPart = rawScalingPart.replace(/\+/g, '');
	rawScalingPart = rawScalingPart.trim();
	// now the actual division of the scalingPart numbers
	// --> slicing at every '/' and at the end + cleaning afterwards
	let lastPosition = 0;
	let scalingTextSwap = false;
	for (let n = 0; n < rawScalingPart.length; n++) {
		if (extractorTools.isItMath(rawScalingPart[n]) == true && scalingTextSwap == false) {
			if (rawScalingPart[n] == '/') {
				let temp = rawScalingPart.slice(lastPosition, n);
				temp = temp.replace(/\//g, '');
				//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
				temp = temp.replace(/ /g, '');
				temp = temp.replace(/ /g, '');
				temp = temp.trim();
				subScaArray.push(parseFloat(temp));
				lastPosition = n;
			}
			if (n + 1 == rawScalingPart.length) {
				let temp = rawScalingPart.slice(lastPosition, n + 1);
				temp = temp.replace(/\//g, '');
				//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
				temp = temp.replace(/ /g, '');
				temp = temp.replace(/ /g, '');
				temp = temp.trim();
				subScaArray.push(parseFloat(temp));
			}
		}
		//the start of the scalingTypeText condition
		if (extractorTools.isItMath(rawScalingPart[n]) == false && scalingTextSwap == false) {
			let temp = rawScalingPart.slice(lastPosition, n);
			temp = temp.replace(/\//g, '');
			//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
			temp = temp.replace(/ /g, '');
			temp = temp.replace(/ /g, '');
			subScaArray.push(parseFloat(temp));
			scalingTextSwap = true;
			lastPosition = n;
		}

		if (n + 1 == rawScalingPart.length && scalingTextSwap == true) {
			let temp = rawScalingPart.slice(lastPosition, n + 1);
			temp = temp.replace(/\//g, '');
			//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
			scalingType = temp;
		}
	}
	return [subScaArray, scalingType];

	//console.log(subScaArray);

	// go threw both concerning parts of skillTabMathRaw and divide the numbers
}
async function divideMathFromSkillTabs(originSkillTabMath) {
	/**first divide into flat and scaling part, then divide them */
	let scaling = false;
	let flatPartRaw = [];
	let flatPart = [];
	let flatPartType = [];
	let flatScaling = false;
	let scalingPartRaw = [];
	let scalingPart = [];
	let lastPosition = 0;
	let skillTabMath = {};
	let scalingType = [];
	let undefinedRest;

	//first some special cleaning
	originSkillTabMath = originSkillTabMath.replace(/\「/g, '');
	originSkillTabMath = originSkillTabMath.replace(/\」/g, '');
	let scalingPartPositions = await getScalingPositions(originSkillTabMath);
	//test if there is a scaling part, if there are parts splice them out --> the rest is the flatPart
	if (scalingPartPositions.length > 0) {
		scaling = true;
		scalingPartRaw = scalingPartPositions.map((currentScalingPart) => {
			//check if there is a multipleScaling in one part
			if (currentScalingPart.length > 2) {
				let multipleScaling = [];
				let outerPart =
					originSkillTabMath.slice(currentScalingPart[0], currentScalingPart[2][0]) +
					originSkillTabMath.slice(currentScalingPart[2][1], currentScalingPart[1]);
				let innerPart = originSkillTabMath.slice(currentScalingPart[2][0], currentScalingPart[2][1]);
				multipleScaling.push(outerPart, innerPart);
				return multipleScaling;
			} else {
				return originSkillTabMath.slice(currentScalingPart[0], currentScalingPart[1]);
			}
		});
	}
	if (scalingPartPositions.length > 0) {
		//the first flatPart is between 0 and the first scaling part
		flatPartRaw[0] = originSkillTabMath.slice(0, scalingPartPositions[0][0]);

		//check if there if there is an extra flatPart at the end
		if (scalingPartPositions[scalingPartPositions.length - 1][1] != originSkillTabMath.length) {
			let endOfScaling = scalingPartPositions[scalingPartPositions.length - 1][1];
			let lastPossibleFlatElement = originSkillTabMath.slice(endOfScaling);
			lastPossibleFlatElement = lastPossibleFlatElement.replace(/\)/g, '');
			lastPossibleFlatElement = lastPossibleFlatElement.trim();
			if (lastPossibleFlatElement.length > 0) {
				flatPartRaw.push(lastPossibleFlatElement);
			}
		}
	} else {
		//otherwise the flatPart is the full Tab
		flatPartRaw[0] = originSkillTabMath.slice(0);
	}

	//check if there are some extra flatParts between the scaling parts/
	if (scalingPartPositions.length > 1) {
		for (let i = 0; i < scalingPartPositions.length - 1; i++) {
			let spaceBetween = originSkillTabMath.slice(scalingPartPositions[i][1], scalingPartPositions[i + 1][0]);
			spaceBetween = spaceBetween.replace(/\(/g, '');
			spaceBetween = spaceBetween.replace(/\)/g, '');
			spaceBetween = spaceBetween.replace(/\+/g, '');
			spaceBetween = spaceBetween.trim();

			if (spaceBetween.length > 1) {
				flatPartRaw.push(spaceBetween);
			}
		}
	}

	/**if there is a scaling part handle it and divide the numbers */
	//first export the numbers, the remaining rest should be the scalingTypeText
	if (scaling == true) {
		for (let i = 0; i < scalingPartRaw.length; i++) {
			let currentScalingPart = scalingPartRaw[i];
			//check for multiple scaling
			if (Array.isArray(currentScalingPart)) {
				let outerPart = await divideScalingPart(currentScalingPart[0]);
				let innerPart = await divideScalingPart(currentScalingPart[1]);
				scalingPart[i] = [outerPart, innerPart];
			} else {
				scalingPart[i] = await divideScalingPart(currentScalingPart);
			}
		}
	}

	/**divide numbers from the flatPart*/
	for (let n in flatPartRaw) {
		let currentFlatContent = flatPartRaw[n];
		lastPosition = 0;

		for (let i = 0; i < currentFlatContent.length; i++) {
			if (currentFlatContent[i] == '/') {
				let temp = currentFlatContent.slice(lastPosition, i);
				temp = temp.replace(/\//g, '');
				temp = temp.replace(/ /g, '');
				flatPart.push(temp);
				lastPosition = i;
			}
			if (!extractorTools.isItMath(currentFlatContent[i]) && flatScaling == false) {
				let temp = currentFlatContent.slice(lastPosition, i);
				temp = temp.replace(/\//g, '');
				temp = temp.replace(/ /g, '');
				flatPart.push(temp);
				flatScaling = true;
				lastPosition = i;
			}

			if (i + 1 == currentFlatContent.length && flatScaling == false) {
				let temp = currentFlatContent.slice(lastPosition, i + 1);
				temp = temp.replace(/\//g, '');
				temp = temp.replace(/ /g, '');
				flatPart.push(temp);
			}

			if (i + 1 == currentFlatContent.length && flatScaling == true) {
				let temp = currentFlatContent.slice(lastPosition, i + 1);
				temp = temp.replace(/\//g, '');
				flatPartType.push(temp);
			}
		}
	}

	/**test if there is any unrecognized rest by deleting every known out of the origin*/

	for (let fp of flatPart) {
		originSkillTabMath = originSkillTabMath.replace(fp, '');
	}

	for (let scPart of scalingPart) {
		for (let sc of scPart) {
			if (Array.isArray(sc))
				sc.map((currentSC) => {
					originSkillTabMath = originSkillTabMath.replace(currentSC, '');
				});
			else originSkillTabMath = originSkillTabMath.replace(sc, '');
		}
	}
	for (let st of scalingType) {
		originSkillTabMath = originSkillTabMath.replace(st, '');
	}
	originSkillTabMath = originSkillTabMath.replace(flatPartType, '');
	originSkillTabMath = originSkillTabMath.replace(/\//g, '');
	originSkillTabMath = originSkillTabMath.replace(/\(/g, '');
	originSkillTabMath = originSkillTabMath.replace(/\)/g, '');
	originSkillTabMath = originSkillTabMath.replace(/%/g, '');
	originSkillTabMath = originSkillTabMath.replace(/\+/g, '');
	undefinedRest = originSkillTabMath;
	//next 2 lines seems like the same but the first space is copied direct out of the terminal and some kind of different from the last space
	originSkillTabMath = originSkillTabMath.replace(/ /g, '');
	originSkillTabMath = originSkillTabMath.replace(/ /g, '');
	if (originSkillTabMath.length == 0) {
		undefinedRest = 'clean';
		//console.log('\x1b[34mclean skillTab number export\x1b[0m');
	} else {
		console.log('\x1b[31munclean skillTab number export, rest:', undefinedRest, '\x1b[0m');
	}

	skillTabMath.flatPart = flatPart;
	//console.log('flatPart: ', flatPart);
	skillTabMath.flatPartType = flatPartType;
	//console.log('flatPartType: ', flatPartType);
	skillTabMath.scalingPart = scalingPart;
	//console.log('scalingPart: ', scalingPart);
	// skillTabMath.scalingPartType = scalingType;
	//console.log('scalingType: ', scalingType);
	skillTabMath.undefindRest = undefinedRest;
	//console.log('undefined rest: ', undefinedRest);
	return skillTabMath;
}

export async function createSkillTabArrays(championData) {
	/**reads out all NOT-EMPTY skillTabs, assigns the concerning text and metaData to it */

	let championAbilities = championData.extracted_data.baseData.abilities;
	let skillTabArray = [];

	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];
		currentAbility = await cleaner.cleanEmptyTextContent(currentAbility);

		skillTabArray.push(await allSkillTabsToArray(currentAbility));
	}

	return skillTabArray;
}

async function allSkillTabsToArray(currentAbility) {
	/** - reshapes all skillTabs from one ability to an array,
	 *  - skillTabs from one textContent stays together
	 *  - COPIES BY VALUE NOT BY REFERENCE!*/
	let skillTabArray = [];

	let textContentKeys = Object.keys(currentAbility.textContent);

	try {
		for (let textKey of textContentKeys) {
			let subSkillTabArray = [];
			let skillTabKeys = Object.keys(currentAbility.textContent[textKey].skillTabs);
			for (var sTK of skillTabKeys) {
				let currentSkillTab = currentAbility.textContent[textKey].skillTabs[sTK];
				let copyOfSkillTab = { ...currentSkillTab };
				// let copyOfSkillTab = await tools.copyObjectByValue(currentSkillTab);
				// copyOfSkillTab.marker = 'test';
				copyOfSkillTab.concerningText = currentAbility.textContent[textKey].text;
				copyOfSkillTab.concerningMeta = currentAbility.metaData;
				copyOfSkillTab = await numbersToFloat(copyOfSkillTab);
				subSkillTabArray.push(copyOfSkillTab);
			}
			if (subSkillTabArray.length > 0) {
				skillTabArray.push(subSkillTabArray);
			}
		}
	} catch (err) {
		console.log(err);
		console.log(currentAbility);
	}

	return skillTabArray;
}

async function numbersToFloat(skillTab) {
	/** transforms all numbers in strings to actual floatNumbers */
	//first all flatValues
	try {
		skillTab.math.flatPart = skillTab.math.flatPart.map((currentNumber) => {
			return parseFloat(currentNumber);
		});
	} catch (err) {
		console.log('%cno flatPart for parseFloat', 'color: grey');
	}
	try {
		//second all scalingValues

		//check for multiScaling
		for (let i = 0; i < skillTab.math.scalingPart.length; i++) {
			let currentScalingPart = skillTab.math.scalingPart[i];

			if (Array.isArray(currentScalingPart[1])) {
				currentScalingPart = currentScalingPart.map((currentScalingPart) => {
					currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
						return parseFloat(currentNumber);
					});
				});
			} else {
				currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
					return parseFloat(currentNumber);
				});
			}
		}
	} catch (err) {
		console.log('%cno scalingPart for parseFloat', 'color: grey');
	}
	return skillTab;
}
