import * as tools from '../tools/tools.js';
import * as Champion from './champion.js';
export async function singleChampion() {
	let championList = await tools.looping.getChampionList();

	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;
		try {
			console.info('singleChampion.js:\t', inGameName, '\t', championEntry.index);
			let championA = await Champion.create(inGameName);
			// await timer();

			await championA.preCalculateFight();

			tools.fileSystem.saveJSONData(championA, `./data/champions/${inGameName}_data.json`);
			tools.fileSystem.saveJSONData(championA, `./lol_extractor/data/champions/${inGameName}_data.json`);
			await timer();
		} catch (err) {
			tools.bugfixing.reportError(
				'singleChampions.js: calculate singleChampion error',
				inGameName,
				err.message,
				err.stack
			);
			console.warn('singleChampions.js: \tcalculate singleChampion error', inGameName);
			console.log(err);
		}
	}
}

function timer() {
	return new Promise((resolve, reject) => {
		setTimeout((res) => resolve(), 500);
	});
}
