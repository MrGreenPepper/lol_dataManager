import * as tools from '../tools/tools.js';
import * as Champion from './champion.js';
async function matchup(inGameNameA, inGameNameB) {
	/**
	 *
	 */
	let championList = tools.looping.getChampionList();
	for (let [indexA, inGameNameA] of championList) {
		let indexB = ++indexA;
		for (indexB; indexB < championList.length; indexB++) {
			try {
				let championA = await Champion.create(inGameNameA);
				let championB = await Champion.create(inGameNameB);
				// await timer();
				for (let i = 0; i < 18; i++) {
					await championA.preCalculateFight(i);
					await championB.preCalculateFight(i);

					championA.preFightCalculations[`level${i}`].enemyStats =
						championB.preFightCalculations[`level${i}`].myStats;
					championB.preFightCalculations[`level${i}`].enemyStats =
						championA.preFightCalculations[`level${i}`].myStats;

					await championA.calculateRealCombatStats();
					await championB.calculateRealCombatStats();
				}

				await tools.saveData(championA, championB.inGameName);
				await tools.saveData(championB, championA.inGameName);
				await timer();
			} catch (err) {
				console.log(err.message);
				console.log(err.stack);
			}
		}
	}
}
