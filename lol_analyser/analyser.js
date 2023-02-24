export * from './analyse_abilities.js';
export * from './items.js';
export * from './unifyMarkers.js';
export * from './cleaner.js';
export * from './specialScalingToSkillTabs.js';
export * from './skillTabsToArray.js';

import * as tools from '../tools/tools.js';

export async function createBackup() {
	await tools.dataSet.createBackupInto('lol_analyser', 'champions');
	await tools.dataSet.createBackupInto('lol_analyser', 'items');

	return;
}

export async function renewData() {
	await tools.dataSet.resetDataFrom('lol_extractor', 'champions');
	await tools.dataSet.resetDataFrom('lol_extractor', 'items');

	await tools.dataSet.overwriteChampionData('extracted_data', 'analysed_data');

	return;
}
