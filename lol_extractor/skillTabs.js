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
					championAbilities[abNum].textContent[textNum].skillTabs[sTNum].concerningMeta = championAbilities[abNum].metaData;
					championAbilities[abNum].textContent[textNum].skillTabs[sTNum].concerningText = championAbilities[abNum].textContent[textNum].text;
				}
			}
		}
	}

	//debugger;

	return championData;
}
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

async function divideSkillTabs(skillTab) {
	//skillTab.content == undefined if already extracted
	if (skillTab == undefined || skillTab == '' || skillTab.content == undefined) {
		return skillTab;
	}

	skillTab.content = skillTab.content.toLowerCase();
	skillTab.marker = skillTab.marker.toLowerCase();
	let skillTabContentRaw = [];
	let skillTabContent = {};

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
	skillTab.content = await skillTabTextIntoMath(skillTab.content);

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
				temp = temp.replace(/ /g, '');
				temp = temp.replace(/ /g, '');
				temp = temp.trim();
				subScaArray.push(parseFloat(temp));
				lastPosition = n;
			}
			if (n + 1 == rawScalingPart.length) {
				let temp = rawScalingPart.slice(lastPosition, n + 1);
				temp = temp.replace(/\//g, '');
				//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
				temp = temp.replace(/ /g, '');
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
			temp = temp.replace(/ /g, '');
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
async function skillTabTextIntoMath(originSkillTabMath) {
	/**first divide into flat and scaling part, then divide them */
	let flatPart;
	let flatPartType;
	let skillTabMath = {};
	let textRegex = /[a-zA-Z]*/i;

	let [scalings, scalingPartsRaw] = getScalingPart(originSkillTabMath);

	[flatPart, flatPartType] = getFlatPart(originSkillTabMath, scalingPartsRaw);

	/**test if there is any unrecognized rest by deleting every known out of the origin*/

	skillTabMath.flatPart = flatPart;
	//console.log('flatPart: ', flatPart);
	skillTabMath.flatPartType = flatPartType;
	//console.log('flatPartType: ', flatPartType);
	skillTabMath.scalingPart = scalings;
	//console.log('scalingPart: ', scalingPart);
	let undefinedRest = testForUnnoticedParts(skillTabMath, originSkillTabMath);

	skillTabMath.undefindRest = undefinedRest;
	//console.log('undefined rest: ', undefinedRest);
	return skillTabMath;
}
function getScalingPart(originSkillTabMathText) {
	let scalings = [];

	let scalingValues;
	let scalingType;

	let scalingPartsRaw = '';

	let scalingPartPositions = getMatchingParenthesis(originSkillTabMathText);
	//extracte the scaling pars
	scalingPartsRaw = scalingPartPositions.map(([startPoint, endPoint]) => {
		return originSkillTabMathText.slice(startPoint + 1, endPoint);
	});

	//now divide the scalingPart into numbers and type
	//let scalingValueRegex = /[0-9]{0,3}/gim;
	let scalingValueRegex = /[\d,\.]{1,7}/gim;

	for (let i = 0; i < scalingPartsRaw.length; i++) {
		let currentScaling = scalingPartsRaw[i];
		switch (true) {
			case currentScaling.includes('based'):
				scalings.push(currentScaling, 'specialScaling');
				break;
			case /\(.*?\)/gim.test(currentScaling):
				//multiscaslingcase
				let multiScaling = {};
				let multiScalingPartPosition = getMatchingParenthesis(currentScaling);
				break;
			default:
				//TODO: round to 2 digits
				scalingValues = [...currentScaling.matchAll(scalingValueRegex)].map((element) => Number(element[0]));

				let scalingTypeRegex = /%\s*?[a-zA-Z].*/gim;

				//let scalingTypeRegex2 = /%\s*?[a-zA-Z].*/im;
				//	let execValue2 = scalingTypeRegex.exec(currentScaling2);
				//	let matchAllValue2 = [...currentScaling.matchAll(scalingTypeRegex2)];
				scalingType = [...currentScaling.matchAll(scalingTypeRegex)];
				//get sure of none scalingType part
				if (scalingType.length == 0) scalingType = 'none';
				else scalingType = scalingType[0][0];
				try {
					scalings.push([scalingValues, scalingType]);
				} catch (err) {
					console.log(err);
				}
		}
	}
	return [scalings, scalingPartsRaw];
}

function getScaling(scalingText) {
	return [scalingValue, scalingType];
}
function getFlatPart(originSkillTabMathText, scalingPartRaw) {
	let flatPartValue;
	let flatPartType;
	let flatPartRaw = originSkillTabMathText;
	//first delete the scalings from the origin text
	scalingPartRaw.forEach((currentScaling) => {
		flatPartRaw = flatPartRaw.replaceAll(currentScaling, '');
	});
	flatPartRaw = flatPartRaw.replaceAll('(', '');
	flatPartRaw = flatPartRaw.replaceAll(')', '');
	//second test for flatparttype and delete it also
	try {
		flatPartType = /[^0-9,^\/,^\/,^\s,^.].*/gim.exec(flatPartRaw);
		flatPartType = flatPartType[0];
		flatPartRaw = flatPartRaw.replaceAll(flatPartType, '');
		flatPartRaw = flatPartRaw.trim();
	} catch {}

	//divide the flatPart into numbers
	flatPartRaw = flatPartRaw.split('/');
	try {
		flatPartValue = flatPartRaw.map((value) => Number(value));
	} catch (err) {
		console.log(err);
		console.log('cant divide flatPart into numbers');
	}

	return [flatPartValue, flatPartType];
}
function testForUnnoticedParts(skillTab, originSkillTabMath) {
	let undefinedRest = originSkillTabMath;
	let flatPart = skillTab.flatPart;
	let scalingPart = skillTab.scalingPart;

	if (skillTab.flatPartType) {
		let flatPartTypeArray = skillTab.flatPartType.split(' ');
		flatPartTypeArray.forEach((element) => {
			undefinedRest = undefinedRest.replace(element, '');
		});
	}

	for (let fp of flatPart) {
		undefinedRest = undefinedRest.replace(fp, '');
	}

	for (let scPart of scalingPart) {
		for (let sc of scPart) {
			if (Array.isArray(sc))
				sc.map((currentSC) => {
					undefinedRest = undefinedRest.replace(currentSC, '');
				});
			else undefinedRest = undefinedRest.replace(sc, '');
		}
	}
	for (let st of scalingPart) {
		undefinedRest = undefinedRest.replace(st[1], '');
	}
	//undefinedRest = undefinedRest.replace(flatPartType, '');
	undefinedRest = undefinedRest.replace(/\//g, '');
	undefinedRest = undefinedRest.replace(/\(/g, '');
	undefinedRest = undefinedRest.replace(/\)/g, '');
	undefinedRest = undefinedRest.replace(/%/g, '');
	undefinedRest = undefinedRest.replace(/\+/g, '');
	undefinedRest = undefinedRest;
	//next 2 lines seems like the same but the first space is copied direct out of the terminal and some kind of different from the last space
	undefinedRest = undefinedRest.replace(/ /g, '');
	undefinedRest = undefinedRest.replace(/ /g, '');
	undefinedRest = undefinedRest.trim();

	if (undefinedRest.length == 0) {
		undefinedRest = 'clean';
		//console.log('\x1b[34mclean skillTab number export\x1b[0m');
	} else {
		undefinedRest = undefinedRest.trim();
		//TODO: fix kindrer e(?)
		console.log('\x1b[31munclean skillTab number export, rest:', undefinedRest, '\x1b[0m');
	}

	flatPart = flatPart.map((element) => Number(element));

	return undefinedRest;
}

//TODO: include update
function divideFlatPartintoNumbers(flatPartRaw) {
	let flatPart = [];

	let scalingRegex = /[a-zA-Z]*/i;
	let flatPartType = scalingRegex.exec(flatPartRaw);

	if (flatPartType.length > 1) console.log('more than one flatPartTyppe');
	else flatPartType = flatPartType[0];

	let flatRegex = /[^a-zA-Z]*/i;
	flatPartRaw = flatRegex.exec(flatPartRaw);

	for (let n = 0; n < flatPartRaw.length; n++) {
		let currentFlatContent = flatPartRaw[n];
		currentFlatContent = currentFlatContent.split('/').map((value) => Number(value));
		flatPart.push(currentFlatContent);
		if (n > 0) console.log('more than one flatPart!');
		/* 
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
		}*/
	}

	return [...flatPart, flatPartType];
}
function getMatchingParenthesis(originSkillTabMath) {
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
