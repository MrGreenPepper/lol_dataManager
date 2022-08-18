export * from './analyse_abilities.js';
export * from './items.js';
export * from './unifyMarkers.js';
export * from './cleaner.js';
export * from './specialScalingToSkillTabs.js';
export * from './text.js';

import * as tools from '../tools.js';

export async function resetData() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		championData.analysed_data = championData.extracted_data;

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

export async function createBackup() {
	console.log('_____________________\n');
	console.log('analyser backup start\n');
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./data/backup/lol_analyser/champions/${championName}_data.json`);
	}

	let itemList = await tools.getItemLinkList();
	for (let itemEntry of itemList) {
		let itemName = tools.itemNameConverter(itemEntry[0]);
		let championData = await tools.loadJSONData(`./data/items/${itemName}_data.json`);
		await tools.saveJSONData(championData, `./data/backup/lol_analyser/items/${itemName}_data.json`);
	}
	console.log('analyser backup end\n');
	console.log('----------------------\n');
	return;
}
