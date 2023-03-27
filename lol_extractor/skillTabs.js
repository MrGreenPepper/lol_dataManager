import * as extractorTools from './extractorTools.js';
import * as tools from '../tools/tools.js';
import * as markerTools from './marker/markerTools.js';
import * as cleaner from './cleaner.js';
import * as looper from '../tools/looping.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSkillTabs() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.identifier;
		//	console.log('\x1b[31m', championEntry.inGameName, '\x1b[0m');
		console.log(championEntry.inGameName, '\t', championEntry.index);
		try {
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);

			/** TASKS */
			championData = await extractSkillTabs(championData);

			await tools.fileSystem.saveJSONData(championData, `${LOGSAVEPATH}${inGameName}_skillTabs.json`);
			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${championEntry.fileSystemName}`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', inGameName);
		}
	}
}

/** Extracts all skillTabs from a Champion, nether the less how many there are and divide it into markers % mathData (--> divideSkillTabs())
 *
 * @param   championData    the complete champion data,
 *
 * @returns championData    the same as input but with extracted skilltabs into markers and mathData
 */
export async function extractSkillTabs(championData) {
	//get the abilitynumbers first

	let championAbilities = championData.extracted_data.abilities;
	let abilityKeys = Object.keys(championAbilities);
	let abilityNumbers = abilityKeys.reduce((acc, element) => {
		if (/[0-9]/g.test(element)) acc++;
		return acc;
	}, 0);

	let allSkillTabs = [];

	for (let currentSkillTab of looper.getSkillTabs(championAbilities)) {
		allSkillTabs.push(currentSkillTab);
	}

	for (let skillTabProperty of looper.getSkillTabProperties(championAbilities, false)) {
		skillTabProperty = await stringIntoFormula(skillTabProperty);
	}

	championAbilities[abNum].textContent[textNum].skillTabs[sTNum].concerningMeta = championAbilities[abNum].metaData;
	championAbilities[abNum].textContent[textNum].skillTabs[sTNum].concerningText =
		championAbilities[abNum].textContent[textNum].text;

	//debugger;

	return championData;
}

async function stringIntoFormula(skillTab) {
	let skillTabContent = {};

	//skillTab.content == undefined if already extracted
	if (skillTab == undefined || skillTab == '' || skillTab.content == undefined) {
		return skillTab;
	}

	skillTab = cleanSkillTab(skillTab);
	skillTab.content = await createSkillTab(skillTab.content);
	skillTab.content = await cleaner.cleanMathContent(skillTab.content);

	let tab = [];
	tab.push(skillTab.marker);
	tab.push(skillTab.content);
	skillTabContent.origin = tab;
	skillTabContent.marker = skillTab.marker;
	skillTabContent.math = skillTab.content;
	//   console.table(skillTabContent);
	//console.log('dividedcontent:');
	//console.log(skillTabContent);
	//debugger;

	return skillTabContent;
}

function cleanSkillTab(skillTab) {
	skillTab.content = skillTab.content.toLowerCase();
	skillTab.content = skillTab.content.replaceAll('−', '-');
	skillTab.content = skillTab.content.replaceAll('」', ' ');
	skillTab.content = skillTab.content.replaceAll('「', ' ');
	skillTab.content = skillTab.content.replaceAll(/\n/gim, '');
	skillTab.marker = skillTab.marker.toLowerCase();

	// divide into markers and math -- old not needed anymore with the new scraper
	//   skillTabContentRaw = await divideIntoMarkerAndMath(skillTab);

	//cleanup text & math ... extract single math numbers from text

	skillTab.marker = cleaner.cleanText(skillTab.marker);

	skillTab.content = skillTab.content.replace(/\:/g, '');

	return skillTab;
}

async function createSkillTab(originSkillTabMath) {
	/**first divide into flat and scaling part, then divide them */
	let skillTabMath = {};

	let scalings = getScalings(originSkillTabMath);

	let flats = getFlatPart(originSkillTabMath);

	/**test if there is any unrecognized rest by deleting every known out of the origin*/

	skillTabMath.flats = flats;
	skillTabMath.scalings = scalings;
	//console.log('scalingPart: ', scalingPart);
	let undefinedRest = testForUnnoticedParts(skillTabMath, originSkillTabMath);

	skillTabMath.undefindRest = undefinedRest;
	//console.log('undefined rest: ', undefinedRest);
	return skillTabMath;
}
function getScalings(originSkillTabMathText) {
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
				scalings.push([currentScaling, 'specialScaling']);
				break;
			case /\(.*?\)/gim.test(currentScaling):
				//multiscaslingcase
				let tester = /\(.*?\)/gim.test(currentScaling);
				let multiScaling = {};
				[multiScaling.scalings, multiScaling.scalingPartsRaw] = getScalings(currentScaling);
				multiScaling.flats = getFlatPart(currentScaling, multiScaling.scalingPartsRaw);
				scalings.push(multiScaling);
				break;
			default:
				//TODO: round to 2 digits
				scalingValues = [...currentScaling.matchAll(scalingValueRegex)].map((element) => Number(element[0]));

				let scalingTypeRegex = /(%|)\s*?[a-zA-Z].*/gim;

				//let scalingTypeRegex2 = /%\s*?[a-zA-Z].*/im;
				//	let execValue2 = scalingTypeRegex.exec(currentScaling2);
				//	let matchAllValue2 = [...currentScaling.matchAll(scalingTypeRegex2)];
				scalingType = [...currentScaling.matchAll(scalingTypeRegex)];
				//get sure of none scalingType part
				if (scalingType.length == 0) scalingType = 'none';
				else scalingType = scalingType[0][0];
				try {
					scalings.push({ scalingValues: scalingValues, scalingType: scalingType });
				} catch (err) {
					console.log(err);
				}
		}
	}
	return scalings;
}

function getFlatPart(originSkillTabMathText) {
	let flatPartValues;
	let flatPartType;
	let flatsRaw = divideIntoFlatPartsRaw(originSkillTabMathText);
	let flats = [];

	//delete innerScaling parts ... need to double loop in case of multiple multiscalings and the next or former index isnt the 'big part'
	for (let i = 0; i < flatsRaw.length; i++) {
		let currentFlatPart = flatsRaw[i];
		flatsRaw = flatsRaw.filter((element) => {
			if (currentFlatPart[0] < element[0] && element[1] < currentFlatPart[1]) return false;
			else return true;
		});
	}
	for (let i = 0; i < flatsRaw.length; i++) {
		let flatPartRaw = flatsRaw[i];
		//second test for flatparttype and delete it also
		try {
			//flatPartType = /[^0-9,^\/,^\/,^\s,^.].*/gim.exec(flatPartRaw);
			flatPartType = /[a-zA-z%].*/gim.exec(flatPartRaw);
			flatPartType = flatPartType[0];
			flatPartRaw = flatPartRaw.replaceAll(flatPartType, '');
			flatPartRaw = flatPartRaw.trim();
		} catch (err) {
			//console.log(err);
		}

		//test for special scaling  or normal levelScaling-> then only a range is given
		flatPartRaw = flatPartRaw.replaceAll('+', '');
		switch (true) {
			case flatPartRaw.includes('/'): //casual scale by level
				flatPartRaw = flatPartRaw.split('/');
				try {
					flatPartValues = flatPartRaw.map((value) => Number(value));
				} catch (err) {
					console.log(err);
					console.log('cant divide flatPart into numbers');
				}
				break;
			case flatPartRaw.includes('-'): //range
				flatPartValues = [...flatPartRaw.matchAll(/[\d.]{1,6}/gim)].map((element) => element[0]);
				flatPartType = 'specialScaling (range) ' + flatPartType;
				flatPartType = flatPartType.trim();
				break;
			default:
				//only one value
				if (flatPartRaw == '' || flatPartRaw.length == 0) flatPartValues = null;
				else flatPartValues = [Number(flatPartRaw)];
		}
		flats.push({ flatPartValues: flatPartValues, flatPartType: flatPartType });
	}
	//divide the flatPart into numbers

	return flats;
}
function divideIntoFlatPartsRaw(originSkillTabMathText) {
	let flatsRaw = [];
	//first delete the scalings from the origin text
	let scalingPartPositions = getMatchingParenthesis(originSkillTabMathText);

	//check if there are multiple flatParts
	for (let i = 0; i < scalingPartPositions.length; i++) {
		let start = scalingPartPositions[i][0];
		let end = scalingPartPositions[i][1];
		let part;
		//at the first one slice from the beginning
		if (i == 0) {
			part = originSkillTabMathText.slice(0, start);
			flatsRaw.push(part);
		}
		//if its not the last one push the space between the parts
		if (i <= scalingPartPositions.length - 2) {
			part = originSkillTabMathText.slice(end, scalingPartPositions[i + 1][0]);
			flatsRaw.push(part);
		}
		//if its the last one push the rest
		if (i == scalingPartPositions.length - 1) {
			part = originSkillTabMathText.slice(end, originSkillTabMathText.length);
			flatsRaw.push(part);
		}
	}
	if (scalingPartPositions.length == 0) {
		flatsRaw.push(originSkillTabMathText);
	}
	flatsRaw = flatsRaw.map((part) => {
		part = part.replaceAll('(', '');
		part = part.replaceAll(')', '');
		part = part.trim();
		return part;
	});
	flatsRaw = flatsRaw.filter((element) => {
		if (element.length > 0) return true;
		else return false;
	});
	return flatsRaw;
}
function testForUnnoticedParts(skillTab, originSkillTabMathText) {
	let undefinedRest = originSkillTabMathText;
	let flats = skillTab.flats;
	let scalings = skillTab.scalings;

	flats.forEach((flatPart) => {
		let flatPartValues = flatPart.flatPartValues;
		let flatPartType = flatPart.flatPartType;
		if (flatPartType) {
			let flatPartTypeArray = flatPartType.split(' ');
			flatPartTypeArray.forEach((element) => {
				undefinedRest = undefinedRest.replace(element, '');
			});
		}

		if (Array.isArray(flatPartValues)) {
			for (let fp of flatPartValues) {
				undefinedRest = undefinedRest.replace(fp, '');
			}
		}
	});

	for (let scalingPart of scalings) {
		if (Array.isArray(scalingPart)) {
			for (let scalingComponent of scalingPart) {
				if (Array.isArray(scalingComponent))
					scalingComponent.map((currentSC) => {
						undefinedRest = undefinedRest.replace(currentSC, '');
					});
				else {
					scalingComponent = scalingComponent.split(' ');
					scalingComponent.forEach((element) => {
						undefinedRest = undefinedRest.replace(element, '');
					});
				}
			}
		} else {
			//if its multiScaling handle the scaling as an extra skillTab
			undefinedRest = testForUnnoticedParts(scalingPart, undefinedRest);
			undefinedRest = undefinedRest.replaceAll('clean', '');
		}
	}
	for (let st of scalings) {
		undefinedRest = undefinedRest.replace(st[1], '');
	}
	//undefinedRest = undefinedRest.replace(flatPartType, '');
	undefinedRest = undefinedRest.replace(/\//g, '');
	undefinedRest = undefinedRest.replace(/\(/g, '');
	undefinedRest = undefinedRest.replace(/\)/g, '');
	undefinedRest = undefinedRest.replace(/%/g, '');
	undefinedRest = undefinedRest.replace(/\+/g, '');
	undefinedRest = undefinedRest.replaceAll('-', '');
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

	//	flatPart = flatPart.map((element) => Number(element));

	return undefinedRest;
}

function getMatchingParenthesis(originSkillTabMath) {
	/**extract raw scalings for later dividing */
	// get the scaling parts positions in the brackets
	let scalingPartPositions = [];
	let scalings = 0;
	let scalingBrackets = 0;
	let scalingScale = [];
	let lastPosition = 0;
	for (let i = 0; i < originSkillTabMath.length; i++) {
		if (originSkillTabMath[i] == '(' && scalingBrackets > 0) {
			scalingScale.push(i);
			scalingBrackets++;
			scalings++;
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
			scalings++;
			scalingBrackets--;
		}
		if (originSkillTabMath[i] == ')' && scalingBrackets > 1) {
			scalingScale.push(i);
			scalings++;
			scalingBrackets--;
		}
		if (i + 1 == originSkillTabMath.length && scalingBrackets > 0) {
			//only gangplank?
			scalingPartPositions.push([lastPosition, i + 1]);
			scalings++;
		}
	}
	return scalingPartPositions;
}
