import getBaseData from './lol_scraper/baseData.js';
import { getAbilitiesData } from './lol_scraper/abilities.js';
import { getInGameData } from './lol_scraper/inGameData.js';
import { getItemData } from './lol_scraper/itemData.js';
import { createBaseChampionDataPool } from './lol_scraper/tools/createBaseData.js';

console.log('%cLog Message', 'color: orange');

let procedure = [false, false, false, false, true];

(async function scrappingProcedure() {
	//list of champions and there baseStats for every single one
	if (procedure[0] == true) await getBaseData();

	//creates single jsonFiles for every champion which is getting filled, to start wich,  with the concerning base data
	if (procedure[1] == true) await createBaseChampionDataPool();

	// champion abilities data
	if (procedure[2] == true) await getAbilitiesData();

	// skillorder, items, masteries
	if (procedure[3] == true) await getInGameData();

	// everyItem independent from the champions
	if (procedure[4] == true) await getItemData();

	console.log('scrapping done');
})();
