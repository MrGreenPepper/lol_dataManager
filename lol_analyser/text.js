import * as tools from '../tools.js';

export async function textToSkillTab() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		console.log(championName);
		let championData = await tools.loadJSONData(`${CHAMPIONSAVEPATH}${championName}_data.json`);

		let championAbilities = championData.analysed_data.baseData.abilities;
		try {
			championAbilities = await identifyInterestingParts(championAbilities);
		} catch (err) {
			console.log(err);
		}

		try {
			championAbilities = await cleanMarkers(championAbilities);
		} catch (err) {
			console.log(err);
			tools.reportError('analyse - deleteAndCleanMarkers', championName, err.message, err.stack);
		}

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./lol_analyser/data/champions/${championName}_data.json`);
	}
}

function identifyInterestingParts(championAbilities) {}
