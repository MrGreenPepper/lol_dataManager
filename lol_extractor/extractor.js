//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
export * from './skillTabs.js';
export * from './metaData.js';
export * from './skillOrder.js';
export * from './masteries.js';
export * from './items.js';
export * from './text.js';
export * from './specialScaling.js';
export * from './objectsToArrays.js';

import * as tools from '../tools/tools.js';

export async function createBackup() {
	await tools.dataSet.createBackupInto('lol_extractor', 'champions');
	await tools.dataSet.createBackupInto('lol_extractor', 'items');

	return;
}

export async function renewData() {
	await tools.dataSet.resetDataFrom('lol_scraper', 'champions');
	await tools.dataSet.resetDataFrom('lol_scraper', 'items');

	await tools.dataSet.overwriteChampionData('scraped_data', 'extracted_data');

	return;
}
