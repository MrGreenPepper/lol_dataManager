export * from './baseData.js';
export * from './abilities.js';
export * from './inGameData.js';
export * from './itemData.js';
export * from './tools/createBaseData.js';
export * from './links.js';

import * as tools from '../tools.js';
export async function createBackup() {
	console.log('_____________________\n');
	console.log('scraper backup start\n');
	//create chmpion backup
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./data/backup/lol_scraper/champions/${championName}_data.json`);
	}

	//create item backup
	let itemList = await tools.getItemList();
	for (let itemEntry of itemList) {
		try {
			let fileSystemName = itemEntry['fileSystemName'];
			let itemData = await tools.loadJSONData(`./data/items/${fileSystemName}`);
			await tools.saveJSONData(itemData, `./data/backup/lol_scraper/items/${fileSystemName}`);
		} catch (error) {
			console.log('item backup error: ', error);
		}
	}
	console.log('scraper backup end\n');
	console.log('----------------------\n');
	return;
}
