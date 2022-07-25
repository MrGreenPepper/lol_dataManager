//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
export * from './skillTabs.js';
export * from './metaData.js';
export * from './skillOrder.js';
export * from './masteries.js';
export * from './items.js';

import * as tools from '../tools.js';
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
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_extractor/champions/${championName}_data.json`
		);
	}

	let itemList = await tools.getItemList();
	for (let itemName of itemList) {
		let championData = await tools.loadJSONData(`./data/items/${itemName}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_extractor/items/${itemName}_data.json`
		);
	}
	console.log('extractor backup end\n');
	console.log('----------------------\n');
	return;
}
