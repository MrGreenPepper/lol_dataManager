//import getBaseData from './lol_scraper/baseData.js';

import * as tools from './tools.js';
import * as markerTools from './lol_analyser/marker/markerTools.js';
import * as scraper from './lol_scraper/scraper.js';
import * as extractor from './lol_extractor/extractor.js';
import * as analyser from './lol_analyser/analyser.js';
import * as calculator from './lol_calculator/calculator.js';
let procedure = [
	[0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0],
	[1, 1, 0, 0],
];
/**dataStorage:
 * every step saves the data twice ... once in the mainData folder and once in the minorData folder of the concerning program
 * every step opens the data from the mainData folder - the minor folder in every program is just kinda log
 *
 * the reset() functions:
 * overides the data of the current program with the data from the last program
 */

await (async function scrappingProcedure() {
	//list of champions and there baseStats for every single one
	if (procedure[0][0] == true) await scraper.getBaseData();

	//creates single jsonFiles for every champion which is getting filled, to start wich,  with the concerning base data
	if (procedure[0][1] == true) await scraper.createBaseChampionDataPool();

	// champion abilities data
	if (procedure[0][2] == true) await scraper.getAbilitiesData();

	// skillorder, items, masteries
	if (procedure[0][3] == true) await scraper.getInGameData();

	// everyItem independent from the champions, SCRAPPING + EXTRACT
	if (procedure[0][4] == true) await scraper.getItemData();

	//creates a backup from the current data in .data for champions&items
	if (procedure[0][5] == true) await scraper.createBackup();
	if (procedure[0].includes(1)) {
		console.log('scrapping done:\t\t', procedure[0]);
		console.log('\n----------------------');
	}
})();

//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells, lösche bestimmte spells etc.
await (async function extractProcedure() {
	/**divides the data into basic parts, like text and numbers
	 * some	of this tasks are already done while scraping here happens the rest
	 * +cleaning
	 *
	 * --baseData--
	 * -->	abilities:	metaData+skillTabs
	 *
	 * --inGameData--
	 * -->	skillOrder
	 * -->	masteries
	 *
	 */
	//resets the data by copieng the scraped_data into extraced_data 1 by 1
	if (procedure[1][0] == true) await extractor.resetData();
	if (procedure[1][1] == true) await extractor.exMetaData();
	//TODO: saves it in a way thus it cant be reruned, current workaround by reseting the data everytime, maybe just do kind of error handling
	if (procedure[1][2] == true) await extractor.exSkillTabs();
	if (procedure[1][3] == true) await extractor.exSkillOrder();
	//TODO: masteries
	if (procedure[1][4] == true) await extractor.exMasteries();
	//TODO: items
	if (procedure[1][5] == true) await extractor.exItems();
	if (procedure[1][6] == true) await extractor.createBackup();

	if (procedure[1].includes(1)) {
		console.log('extracting done:\t\t', procedure[1]);
		console.log('\n----------------------');
	}
})();

//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells, lösche bestimmte spells etc.
await (async function analyseProcedure() {
	if (procedure[2][0]) await analyser.resetData();
	if (procedure[2][1]) await analyser.cleanSkillTabMarkers();
	if (procedure[2][2]) await analyser.simplifyAbilities();
	if (procedure[2][3]) await analyser.unifyItems();
	if (procedure[2][4]) await analyser.showAllMarkerPositions();
	if (procedure[2][5]) await analyser.createBackup();

	if (procedure[2].includes(1)) console.log('analysing done:\t\t', procedure[2]);
})();

await (async function calculatorProcedure() {
	if (procedure[3][0]) await calculator.resetData();
	if (procedure[3][1]) await calculator.singleChampion();
	if (procedure[3][2]) await calculator.matchup();
	if (procedure[3][3]) await calculator.createBackup();

	if (procedure[3].includes(1)) console.log('calculating done:\t\t', procedure[3]);
})();
