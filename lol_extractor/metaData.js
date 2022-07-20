import * as extractorTools from './extractorTools.js';
import * as tools from '../tools.js';
import * as cleaner from './cleaner.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exMetaData() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		console.log('\n\n ', championName);
		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await extractMetaData(championData);
			championData = await metaNumbersToFloat(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_metaData.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('metaData extraction failed at champion: ', championName);
		}
	}
	return;
}

export function extractMetaData(championData) {
	let metaDataKeys = [];
	let abilityKeys;
	let baseAbilityData = championData.extracted_data.baseData.abilities;

	abilityKeys = Object.keys(baseAbilityData);
	abilityKeys.forEach((abilityKey) => {
		if ('metaData' in baseAbilityData[abilityKey]) {
			metaDataKeys.push(abilityKey);
		}
	});

	metaDataKeys.forEach((metaKey) => {
		baseAbilityData[metaKey].metaData = divideMetaData(baseAbilityData[metaKey].metaData);
	});

	//I know this line isnt necessary, but for better reading I keep it
	championData.extracted_data.baseData.abilities = baseAbilityData;
	return championData;
}

function divideMetaData(rawMetaData) {
	let marker;
	let mathRaw;

	let metaData = {};

	let seperatorPosition;
	let rawMetaDataKeys = Object.keys(rawMetaData);

	//first seperate marker and math
	for (let i = 0; i < rawMetaDataKeys.length; i++) {
		let currentMetaDataString = rawMetaData[rawMetaDataKeys[i]];
		seperatorPosition = currentMetaDataString.indexOf(':');
		marker = rawMetaData[rawMetaDataKeys[i]].slice(0, seperatorPosition);
		mathRaw = rawMetaData[rawMetaDataKeys[i]].slice(seperatorPosition);
		marker = cleaner.firstClean(marker);
		mathRaw = cleaner.firstClean(mathRaw);
		metaData[rawMetaDataKeys[i]] = {};
		metaData[rawMetaDataKeys[i]].marker = marker;
		metaData[rawMetaDataKeys[i]].math = mathRaw;
		metaData[rawMetaDataKeys[i]].origin = rawMetaData[rawMetaDataKeys[i]];
	}

	//console.table(metaData);

	//now split the mathpart if necessary
	if (rawMetaDataKeys.length > 0) {
		for (let i = 0; i < rawMetaDataKeys.length; i++) {
			metaData[rawMetaDataKeys[i]].math = divideMath(metaData[rawMetaDataKeys[i]].math);

			console.table(metaData[rawMetaDataKeys[i]].math);
		}
		console.table(metaData);
		return metaData;
	} else {
		return metaData;
	}
}

function divideMath(originMath) {
	/** !!!!!!!!!!!!! JUST COPIED FROM skillTabs.js - divideMathFromSkillTabs()    !!!!!!!!!!!!!!!!!!!!!! */
	/**first divide into flat and scaling part, then divide them */

	let flatPartRaw = [];
	let flatPart = [];
	let flatPartType = [];
	let flatScaling = false;

	let lastPosition = 0;
	let tabMath = {};

	let undefinedRest;

	//first some special cleaning
	originMath = originMath.replace(/\「/g, '');
	originMath = originMath.replace(/\」/g, '');
	/**extract raw scalingPart for later dividing */
	// get the scaling parts positions in the brackets

	lastPosition = 0;

	flatPartRaw[0] = originMath.slice(0);

	/**divide numbers from the flatPart*/
	for (let n in flatPartRaw) {
		let currentFlatContent = flatPartRaw[n];
		lastPosition = 0;

		for (let i = 0; i < currentFlatContent.length; i++) {
			if (currentFlatContent[i] == '/') {
				let temp = currentFlatContent.slice(lastPosition, i);
				temp = temp.replace(/\//g, '');
				temp = temp.trim();
				flatPart.push(temp);
				lastPosition = i;
			}
			if (!extractorTools.isItMath(currentFlatContent[i]) && flatScaling == false) {
				let temp = currentFlatContent.slice(lastPosition, i);
				temp = temp.replace(/\//g, '');
				temp = temp.trim();
				flatPart.push(temp);
				flatScaling = true;
				lastPosition = i;
			}

			if (i + 1 == currentFlatContent.length && flatScaling == false) {
				let temp = currentFlatContent.slice(lastPosition, i + 1);
				temp = temp.replace(/\//g, '');
				temp = temp.trim();
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
		originMath = originMath.replace(fp, '');
	}

	originMath = originMath.replace(flatPartType, '');
	originMath = originMath.replace(/\//g, '');
	originMath = originMath.replace(/\(/g, '');
	originMath = originMath.replace(/\)/g, '');
	originMath = originMath.replace(/%/g, '');
	originMath = originMath.replace(/\+/g, '');
	undefinedRest = originMath;
	//next 2 lines seems like the same but the first space is copied direct out of the terminal and some kind of different from the last space
	originMath = originMath.replace(/ /g, '');
	originMath = originMath.replace(/ /g, '');
	if (originMath.length == 0) {
		undefinedRest = 'clean';
		//	console.log('\x1b[34mclean mathTab number export\x1b[0m');
	} else {
		console.log('\x1b[31munclean mathTab number export, rest:', undefinedRest, '\x1b[0m');
	}

	tabMath.flatPart = flatPart;
	//console.log('flatPart: ', flatPart);
	tabMath.flatPartType = flatPartType;
	//console.log('flatPartType: ', flatPartType);

	tabMath.undefindRest = undefinedRest;
	//	console.log('undefined rest: ', undefinedRest);
	return tabMath;
}

export async function metaNumbersToFloat(championData) {
	let championAbilities = championData.extracted_data.baseData.abilities;
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];

		let metaKeys = Object.keys(currentAbility.metaData);

		for (let currentMetaKey of metaKeys) {
			let currentMetaData = currentAbility.metaData[currentMetaKey];
			if (Array.isArray(currentMetaData.math.flatPart))
				currentMetaData.math.flatPart = currentMetaData.math.flatPart.map(
					(currentFlatPart) => {
						return parseFloat(currentFlatPart);
					}
				);
		}
	}
	return championData;
}
