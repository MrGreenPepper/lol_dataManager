//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
export * from './skillTabs.js';
export * from './metaData.js';
export * from './skillOrder.js';
export * from './masteries.js';
export * from './items.js';
export * from './text.js';
export * from './specialScaling.js';
export * from './objectsToArrays.js';

import * as tools from '../tools.js';
export async function resetData() {
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;

		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		championData.extracted_data = championData.scraped_data;

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

export async function createBackup() {
	console.log('_____________________\n');
	console.log('extractor backup start\n');
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./data/backup/lol_extractor/champions/${championName}_data.json`);
	}

	let itemList = await tools.getItemList();
	for (let itemEntry of itemList) {
		let fileSystemName = itemEntry['fileSystemName'];
		let championData = await tools.loadJSONData(`./data/items/${fileSystemName}`);
		await tools.saveJSONData(championData, `./data/backup/lol_extractor/items/${fileSystemName}`);
	}
	console.log('extractor backup end\n');
	console.log('----------------------\n');
	return;
}
