export * from './baseData.js';
export * from './abilities.js';
export * from './inGameData.js';
export * from './itemData.js';
export * from './tools/createBaseData.js';

import * as tools from '../tools.js';
export async function createBackUp() {
	let championList = tools.getChampionList();
	for (let championName of championList) {
		let championData = tools.loadJSONData(`./data/champions/${championName}_data.json`);
		tools.saveJSONData(
			championData,
			`./data/backup/lol_scraper/champions/${championName}_data.json`
		);
	}
}
