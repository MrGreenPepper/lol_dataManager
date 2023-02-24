import * as tools from './tools.js';
import fs from 'fs';

export async function resetDataFrom(entryPoint, category) {
	let directoryContent = await fs.readdirSync(`./data/backup/${entryPoint}/${category}`);

	for (let fileName of directoryContent) {
		let backupData = await tools.fileSystem.loadJSONData(`./data/backup/${entryPoint}/${category}/${fileName}`);
		await tools.fileSystem.saveJSONData(backupData, `./data/${category}/${fileName}`);
	}

	return;
}

/**creates a backup of the current data into the backup folder at a specific entry point
 * @param {string} entryPoint [lol_scraper, lol_extractor, lol_analyser, lol_calculator] - the entry point of the data
 * @param {string} category [champions, items] - the category of the data
 */
export async function createBackupInto(entryPoint, category) {
	let directoryContent = await fs.readdirSync(`./data/${category}`);

	for (let fileName of directoryContent) {
		let backupData = await tools.fileSystem.loadJSONData(`./data/${category}/${fileName}`);
		//minimum check if the data is valid
		if (Object.keys(backupData).length > 0)
			await tools.fileSystem.saveJSONData(backupData, `./data/backup/${entryPoint}/${category}/${fileName}`);
		else console.error(`backup data is empty for ${fileName}`);
	}

	return;
}

/** overwrites an oldDataSet with another dataset */
export async function overwriteChampionData(superiorData, oldDataSet) {
	let championList = await tools.looping.getChampionList();

	for (let championEntry of championList) {
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);
		championData[oldDataSet] = championData[superiorData];
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${championEntry.fileSystemName}`);
	}

	return;
}

/**creates an identifier out of the championname for later merging of different datas */
export function createIdentifier(championName) {
	championName = championName.toLowerCase();
	let whiteRegex = /[a-z]/;
	championName = championName.split('');
	championName = championName.reduce((previousLetter, currentLetter) => {
		if (whiteRegex.test(currentLetter)) return previousLetter + currentLetter;
		else return previousLetter;
	});

	return championName;
}

//not finished cause its easier with identifiers
/** merges the minor dataset into the major one,
 * the keyPosition represents the criteria which minorDataSet is assigned to which majorDataSet by comparing there values
 * @param [array{objects}] majorData   	- an array of dataSets
 * @param [array{objects}] minorData  	- an array of dataSets
 * @param [array] majorKeyPosition 		- array which leads to the merging criteria
 * @param [array] minorKeyPosition 		- array which leads to the merging criteria
 *
 * @returns [array{objects}] majorData	- merged array of dataSets
 */
export async function mergeData(
	majorData,
	majorCriteriaPosition,
	minorDataSet,
	minorCriteriaPosition,
	importPosition = [],
	exportPosition = [],
	simplifyCriteria = true
) {
	let majorCriteriaValue = getTheMergingCriteria(majorData, majorCriteriaPosition);
	if (simplifyCriteria) majorCriteriaValue = simplifyMergingCriteria(majorCriteriaValue);

	for (let minorData of minorDataSet) {
		let minorCriteriaValue = getTheMergingCriteria(minorData, minorCriteriaPosition);
		if (simplifyCriteria) minorCriteriaValue = simplifyMergingCriteria(minorCriteriaValue);

		//merge
		if (majorCriteriaValue == minorCriteriaValue) {
			let majorCache = majorDataSet;
			let minorCache = minorData;
			//go to the right entryPoint
			for (let importKey of importPosition) {
				majorCache = majorCache[importKey];
			}
			for (let exportKey of exportPosition) {
				minorCache = minorCache[exportKey];
			}
			majorCache = minorCache;
		}
	}

	return majorData;
}

function getTheMergingCriteria(dataSet, criteriaPosition) {
	let pathLength = criteriaPosition.length - 1;
	let criteriaValue;
	let objectCache = dataSet;
	for (let [index, keyName] of criteriaPosition.entries()) {
		if (index == pathLength) {
			criteriaValue = objectCache[keyName];
		} else {
			objectCache = objectCache[keyName];
		}
	}
	return criteriaValue;
}

function simplifyMergingCriteria(criteriaValue) {
	let helpArray = [];
	let testValue = Array.prototype.map((letter) => console.log(letter), criteriaValue);

	if (typeof criteriaValue == 'string') {
		criteriaValue = criteriaValue.toLowerCase();
		criteriaValue;
	}
	return criteriaValue;
}
