export * from './baseData.js';
export * from './abilities.js';
export * from './inGameData.js';
export * from './itemData.js';
export * from './tools/createBaseChampionDataSet.js';
export * from './links.js';

import * as tools from '../tools/tools.js';

export async function createBackup() {
	await tools.dataSet.createBackupInto('lol_scraper', 'champions');
	await tools.dataSet.createBackupInto('lol_scraper', 'items');

	return;
}
