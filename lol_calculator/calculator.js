export * from './singleChampion.js';
export * from './matchup.js';
import * as tools from '../tools.js';

export async function resetData() {
	let championList = await tools.getChampionLinkList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		championData.calculated_data = championData.analysed_data;

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

export async function createBackup() {
	console.log('_____________________\n');
	console.log('calculator backup start\n');
	let championList = await tools.getChampionLinkList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		await tools.saveJSONData(
			championData,
			`./data/backup/lol_calculator/champions/${championName}_data.json`
		);
	}

	console.log('calculator backup end\n');
	console.log('----------------------\n');
	return;
}
