export * from './singleChampion.js';
export * from './matchup.js';
import * as tools from '../tools/tools.js';

export async function createBackup() {
	await tools.dataSet.createBackupInto('lol_calculator', 'champions');
	await tools.dataSet.createBackupInto('lol_calculator', 'items');

	return;
}

export async function renewData() {
	await tools.dataSet.resetDataFrom('lol_analyser', 'champions');
	await tools.dataSet.resetDataFrom('lol_analyser', 'items');

	//in case there is an no or an bugged dataSet, copy the old into the new
	await tools.dataSet.overwriteChampionData('analyser_data', 'calculated_data');

	return;
}
