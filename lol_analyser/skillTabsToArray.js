import * as tools from '../tools.js';
import * as cleaner from './cleaner.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function skillTabsToArray() {
	//TODO: moved from extractor to analyser ... control if everything is still fine
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		//	console.log('\x1b[31m', champEntry.championName, '\x1b[0m');
		console.log(champEntry.championName, '\t', champEntry.index);
		try {
			//first load the data
			let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

			/** TASKS */
			championData.extracted_data.baseData.abilities = await createSkillTabArrays(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillTabs.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
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
/* 
async function numbersToFloat(skillTab) {
	//transforms all numbers in strings to actual floatNumbers 
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
 */
