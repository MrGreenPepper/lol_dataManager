//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
export * from './skillTabs.js';
export * from './metaData.js';
export * from './skillOrder.js';
export * from './masteries.js';

import * as tools from '../tools.js';
export async function resetData() {
	let championList = await tools.getChampionList();

	for (let championName of championList) {
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		championData.extracted_data = championData.scraped_data;

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}
