import * as tools from '../tools.js';
import * as Champion from './champion.js';
export async function singleChampion() {
	let championList = await tools.getChampionList();

	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		try {
			console.info('singleChampion.js:\t', championName, '\t', championEntry.indexNumber);
			let championA = await Champion.create(championName);
			// await timer();

			await championA.preCalculateFight();

			tools.saveJSONData(championA, `./data/champions/${championName}_data.json`);
			tools.saveJSONData(
				championA,
				`./lol_extractor/data/champions/${championName}_data.json`
			);
			await timer();
		} catch (err) {
			tools.reportError(
				'singleChampions.js: calculate singleChampion error',
				championName,
				err.message,
				err.stack
			);
			console.warn('singleChampions.js: \tcalculate singleChampion error', championName);
			console.log(err);
		}
	}
}

function timer() {
	return new Promise((resolve, reject) => {
		setTimeout((res) => resolve(), 500);
	});
}
