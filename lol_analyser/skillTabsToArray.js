import * as tools from '../tools/tools.js';
import * as cleaner from './cleaner.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function skillTabsToArray() {
	//TODO: moved from extractor to analyser ... control if everything is still fine
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystemName;
		//	console.log('\x1b[31m', championEntry.inGameName, '\x1b[0m');
		console.log(championEntry.inGameName, '\t', championEntry.index);
		try {
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);

			/** TASKS */
			championData.extracted_data.abilities = await createSkillTabArrays(championData);

			await tools.fileSystem.saveJSONData(championData, `${LOGSAVEPATH}${inGameName}_skillTabs.json`);
			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${championEntry.fileSystemName}`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', inGameName);
		}
	}
}

export async function createSkillTabArrays(championData) {
	/**reads out all NOT-EMPTY skillTabs, assigns the concerning text and metaData to it */

	let championAbilities = championData.extracted_data.abilities;
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
