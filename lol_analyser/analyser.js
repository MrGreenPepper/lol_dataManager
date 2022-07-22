export * from './marker/markerTools.js';
export * from './analyse_abilities.js';
export * from './items.js';

import * as markerTools from './marker/markerTools.js';
import * as tools from '../tools.js';

export async function resetData() {
	let championList = await tools.getChampionList();

	for (let championName of championList) {
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		championData.analysed_data = championData.extracted_data;

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

export async function createBackup() {
	console.log('_____________________\n');
	console.log('analyser backup start\n');
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_analyser/champions/${championName}_data.json`
		);
	}

	let itemList = await tools.getItemList();
	for (let itemName of itemList) {
		let championData = await tools.loadJSONData(`./data/items/${itemName[0]}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_analyser/items/${itemName[0]}_data.json`
		);
	}
	console.log('analyser backup end\n');
	console.log('----------------------\n');
	return;
}