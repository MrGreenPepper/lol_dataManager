import * as tools from '../tools.js';
import * as Champion from './champion.js';
export async function singleChampion() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			let championA = await Champion.create(championName);
			// await timer();
			for (let i = 0; i < 18; i++) {
				await championA.preCalculateFight(i);
			}

			await timer();
		} catch (err) {
			tools.reportError(
				'singleChampions.js: calculate singleChampion error',
				championName,
				err.message,
				err.message
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
