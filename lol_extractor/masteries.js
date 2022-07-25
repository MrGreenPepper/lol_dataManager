import * as tools from '../tools.js';

const LOGSAVEPATH = './lol_extractor/champions/';
const DATASAVEPATH = './data/champions/';

export async function exMasteries() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;

		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await extractMasteries(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_masteries.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('masteries extraction failed at champion: ', championName);
		}
	}
}

async function extractMasteries(championData) {
	return championData;
}
