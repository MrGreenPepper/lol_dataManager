import * as tools from './tools.js';
import { procedure } from '../dataManager.js';

/** returns a list of champions and a variety of concerning links */
export async function getChampionList() {
	let championList = await tools.fileSystem.loadJSONData('./data/championList.json');
	// if length is 2 its a range otherwise its a list of champions

	if (procedure.championsAssortment == 'all') return championList;
	if (procedure.championsAssortment.length == 2) {
		championList = championList.filter((element, index) => {
			if (procedure.championsAssortment[0] <= index && index <= procedure.championsAssortment[1]) return true;
			else return false;
		});
	} else {
		championList = championList.filter((element, index) => {
			if (procedure.championsAssortment.includes(index)) return true;
			else return false;
		});
	}
	return championList;
}

/** loads and returns the complete list of items
 * @returns {array of objects} itemList
 */
export async function getItemList() {
	let itemList = await tools.fileSystem.loadJSONData('./data/itemList.json');
	return itemList;
}

export function* getAllSkills(dataSet, deleteAllEmpty = true) {
	for (let [skillKey, skillValue] of Object.entries(dataSet)) {
		if (deleteAllEmpty) {
			if (Object.keys(skillValue).length > 0) yield { [skillKey]: skillValue };
		} else yield { [skillKey]: skillValue };
	}
}

/** returns all abilities of a given data  */
export function* getAbilities(data) {
	for (let ability of searchByKeyInObject('ability', data)) {
		yield ability;
	}
}

/** returns all textContents of a given data  */
export function* getTextContents(data) {
	for (let textContent of searchByKeyInObject('textContent', data)) {
		yield textContent;
	}
}

/** returns all textParts of a given data  */
export function* getTextParts(data) {
	for (let textParts of searchByKeyInObject('textPart', data)) {
		yield textParts;
	}
}

/** returns all skillTabs of all textParts of all abilities a given dataSet  */
/*export function* getSkillTabs(championDataSet) {
	for (let textPart of getTextParts(championDataSet)) {
		for (let [skillTabKeys, skillTabValue] of Object.entries(textPart)) {
			yield skillTabValue;
		}
	}
}
*/

/** returns all skillTabs of a given data  */
export function* getSkillTabs(data, deleteAllEmpty = true) {
	for (let skillTab of searchByKeyInObject('skillTab', data)) {
		if (deleteAllEmpty) {
			if (Object.keys(skillTab.skillTabs).length > 0) yield skillTab;
		} else yield skillTab;
	}
}

/** returns all skillTabs of a given data  */
export function* getSkillTabProperties(data, withKey = true) {
	for (let skillTabProperty of searchByKeyInObject('skillTabProperty', data, withKey)) {
		yield skillTabProperty;
	}
}
/** applies a given function to every skill (passive + abilities) of a specific dataSet (extracted/analysed/ ... )
 * @param {object} championDataSet
 * @param {function} applyFunction
 */
export function applyToAllSkills(championDataSet, applyFunction) {
	for (let ability of getAbilities(championDataSet)) {
		applyFunction(ability);
	}
}

/** applies a function to every single skillTab
 *
 * @param {object} championDataSet
 * @param {function} applyFunction - function which is applied to every single skillTab
 *
 */
export async function applyToAllSkillTabs(championDataSet, applyFunction) {
	for (let skillTab of getSkillTabs(championDataSet)) {
		await applyFunction(skillTab);
	}
	return;
}

/** searches in an object for matching keys and returns the key-value pairs */
function* searchByKeyInObject(searchPhrase, dataObject, withKey = true) {
	try {
		let searchRegex = new RegExp(searchPhrase, 'gi');
		for (let [dataKey, dataValue] of Object.entries(dataObject)) {
			if (searchRegex.test(dataKey)) {
				if (withKey) yield { [dataKey]: dataValue };
				else yield dataValue;
			} else {
				if (isObjectNested(dataValue)) {
					for (let deepData of searchByKeyInObject(searchPhrase, dataValue, withKey)) {
						yield deepData;
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
	}
}

/**tests if the object is nested/contains other content */
function isObjectNested(testObject) {
	try {
		let objectTest = typeof testObject == 'object';
		let notArrayTest = !Array.isArray(testObject);
		let notNullTest = testObject != null;
		let contentTest = Object.keys(testObject).length > 0;
		if (objectTest && notArrayTest && notNullTest && contentTest) {
			return true;
		} else {
			return false;
		}
	} catch {
		return false;
	}
}
