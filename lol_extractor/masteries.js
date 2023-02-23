import * as tools from '../tools/tools.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exMasteries() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;

		try {
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${inGameName}_data.json`);

			championData = await extractMasteries(championData);

			await tools.fileSystem.saveJSONData(championData, `${LOGSAVEPATH}${inGameName}_masteries.json`);
			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${inGameName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('masteries extraction failed at champion: ', inGameName);
		}
	}
}

async function extractMasteries(championData) {
	return championData;
}
