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

export async function overwriteChampionData(newDataSet, oldDataSet) {
	let championList = await tools.looping.getChampionList();

	for (let championEntry of championList) {
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystenName}`);
		championData[oldDataSet] = championData[newDataSet];
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${championEntry.fileSystenName}`);
	}

	return;
}

/** merges the minor dataset into the major one, 
 * the keyPosition represents the criteria which minorDataSet is assigned to which majorDataSet by comparing there values
 * @param [array{objects}] majorData   	- an array of dataSets
 * @param [array{objects}] minorData  	- an array of dataSets
 * @param [array] majorKeyPosition 		- array which leads to the merging criteria
 * @param [array] minorKeyPosition 		- array which leads to the merging criteria
 * 
 * @returns [array{objects}] majorData	- merged array of dataSets
  */
export async function mergeData(majorData, majorKeyPosition, minorData, minorKeyPosition)
