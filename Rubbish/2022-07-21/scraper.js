export * from './baseData.js';
export * from './abilities.js';
export * from './inGameData.js';
export * from './itemData.js';
export * from './tools/createBaseData.js';

import * as tools from '../tools.js';
export async function createBackup() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_scraper/champions/${championName}_data.json`
		);
	}

	let itemList = await tools.getItemList();
	for (let itemName of itemList[0]) {
		let championData = await tools.loadJSONData(`./data/items/${itemName}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_scraper/items/${itemName}_data.json`
		);
	}
	return;
}
