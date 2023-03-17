import * as extractorTools from './extractorTools.js';
import * as tools from '../tools/tools.js';
import * as cleaner from './cleaner.js';
import * as naming from '../tools/naming.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exMetaData() {
	let championList = await tools.looping.getChampionList();
	for (let [index, championEntry] of championList.entries()) {
		console.log('\n', championEntry.inGameName);
		try {
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);

			championData.extracted_data.abilities = await extractMetaData(championData);
			championData = await metaNumbersToFloat(championData);

			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${championEntry.fileSystemName}`);
		} catch (err) {
			console.log(err);
			console.log('metaData extraction failed at champion: ', index, ' - ', championEntry.fileSystemName);
		}
	}
	return;
}

export function extractMetaData(championData) {
	let abilitiesWithMetaData = [];
	let abilityKeys;
	let baseAbilityData = championData.extracted_data.abilities;

	abilityKeys = Object.keys(baseAbilityData);
	//check which abilities has metadata;
	abilityKeys.forEach((abilityKey) => {
		if ('metaData' in baseAbilityData[abilityKey]) {
			abilitiesWithMetaData.push(abilityKey);
		}
	});

	abilitiesWithMetaData.forEach((metaKey) => {
		baseAbilityData[metaKey].metaData = divideMetaData(baseAbilityData[metaKey].metaData);
	});

	return baseAbilityData;
}

/**divides the metaData in a describing text part and a math part
 * if the math part includes a couple numbers divide them also
 */
function divideMetaData(rawMetaData) {
	let marker;
	let mathRaw;

	let metaData = {};

	let separatorPosition;
	let rawMetaDataKeys = Object.keys(rawMetaData);

	//first seperate marker and math
	for (let i = 0; i < rawMetaDataKeys.length; i++) {
		let currentMetaDataString = rawMetaData[rawMetaDataKeys[i]];
		let metaDataIdentifier = naming.generateMetaDataDescription(i);
		metaData[metaDataIdentifier] = {};

		separatorPosition = currentMetaDataString.text.indexOf(':');
		marker = rawMetaData[rawMetaDataKeys[i]].text.slice(0, separatorPosition);
		mathRaw = rawMetaData[rawMetaDataKeys[i]].text.slice(separatorPosition);
		marker = cleaner.metaTextCleaner(marker);
		mathRaw = cleaner.metaTextCleaner(mathRaw);
		metaData[metaDataIdentifier].marker = marker;
		metaData[metaDataIdentifier].math = mathRaw;
		metaData[metaDataIdentifier].origin = rawMetaData[rawMetaDataKeys[i]];

		//if we scraped a specialScaling part, copy it also
		//TODO: handle the specialScaling here
		try {
			metaData[metaDataIdentifier].specialScaling = rawMetaData[rawMetaDataKeys[i]].specialScaling;
		} catch {}

		//now split the mathpart

		metaData[metaDataIdentifier].math = divideMath(metaData[metaDataIdentifier].math);

		return metaData;
	}
}

//TODO: generalize this and get it to tools
function divideMath(originMathText) {
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
	originMathText = originMathText.replace(/\「/g, '');
	originMathText = originMathText.replace(/\」/g, '');
	/**extract raw scalingPart for later dividing */
	// get the scaling parts positions in the brackets

	flatPartRaw[0] = originMathText.slice(0);

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
		originMathText = originMathText.replace(fp, '');
	}

	originMathText = originMathText.replace(flatPartType, '');
	originMathText = originMathText.replace(/\//g, '');
	originMathText = originMathText.replace(/\(/g, '');
	originMathText = originMathText.replace(/\)/g, '');
	originMathText = originMathText.replace(/%/g, '');
	originMathText = originMathText.replace(/\+/g, '');
	undefinedRest = originMathText;
	//next 2 lines seems like the same but the first space is copied direct out of the terminal and some kind of different from the last space
	originMathText = originMathText.replace(/ /g, '');
	originMathText = originMathText.replace(/ /g, '');
	if (originMathText.length == 0) {
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
	let championAbilities = championData.extracted_data.abilities;
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];

		let metaKeys = Object.keys(currentAbility.metaData);

		for (let currentMetaKey of metaKeys) {
			let currentMetaData = currentAbility.metaData[currentMetaKey];
			if (Array.isArray(currentMetaData.math.flatPart))
				currentMetaData.math.flatPart = currentMetaData.math.flatPart.map((currentFlatPart) => {
					return parseFloat(currentFlatPart);
				});
		}
	}
	return championData;
}
