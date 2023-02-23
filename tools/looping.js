import * as tools from './tools.js';
import { procedure } from '../dataManager.js';

export async function getChampionList() {
	let championList = await tools.fileSystem.loadJSONData('./data/championLinks.json');
	// if length is 2 its a range otherwise its a list of champions
	if (procedure.champions.length == 2) {
		championList = championList.filter((element, index) => {
			if (procedure.champions[0] <= index && index <= procedure.champions[1]) return true;
			else return false;
		});
	} else {
		championList = championList.filter((element, index) => {
			if (procedure.champions.includes(index)) return true;
			else return false;
		});
	}
	return championList;
}

export async function getItemList() {
	let itemList = await tools.fileSystem.loadJSONData('./data/itemList.json');
	return itemList;
}

/** applies a function to every single skillTab
 *
 * @param {object} skillTabs - kind of array out of skillTabs in form of an object
 * @param {function} applyFunction - function which is applied to every single skillTab
 *
 * @returns {object} skillTabs - modified skillTabsArray
 */
export async function applyToAllSkillTabs(skillTabs, applyFunction) {
	let abilityKeys = Object.keys(skillTabs);
	try {
		for (let i of abilityKeys) {
			let currentAbility = skillTabs[i];
			for (let n = 0; n < currentAbility.length; n++) {
				let currentContent = currentAbility[n];
				for (let c = 0; c < currentContent.length; c++) {
					skillTabs[i][n][c] = await applyFunction(currentContent[c]);
				}
			}
		}
	} catch (err) {
		console.log(err);
		console.log(skillTabs);
	}

	return skillTabs;
}