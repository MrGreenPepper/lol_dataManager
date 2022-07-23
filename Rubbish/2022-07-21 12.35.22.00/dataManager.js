//import getBaseData from './lol_scraper/baseData.js';

import * as tools from './tools.js';
import * as markerTools from './lol_analyzer/marker/markerTools.js';
import * as extractor from './lol_extractor/extractor.js';
import * as scraper from './lol_scraper/scraper.js';
import * as analyser from './lol_analyzer/analyzer.js';

let procedure = [
	[0, 0, 0, 0, 0, 0],
	[1, 1, 1, 1, 0, 1],
	[0, 0, 0, 0, 0, 0, 0],
];

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
//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells
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
	//TODO: saves it in a way thus it cant be reruned, current workaround by reseting the data everytime
	if (procedure[1][2] == true) await extractor.exSkillTabs();
	if (procedure[1][3] == true) await extractor.exSkillOrder();
	//TODO: masteries
	if (procedure[1][4] == true) await extractor.exMasteries();
	if (procedure[1][5] == true) await extractor.createBackup();

	//	await extractor.extractChampionData();
	//	await extractor.getTheFormulaData();
	if (procedure[1].includes(1)) {
		console.log('extracting done:\t\t', procedure[0]);
		console.log('\n----------------------');
	}
})();

//2.1
if (procedure[2][2])
	championData.abilities.skillTabs = await markerTools.createSkillTabArray(
		championData.abilities
	);
//all mathStrings to Math;
// championData.abilities = await markerTools.allStringsToMath(championData.abilities);
//3.
if (procedure[2][3])
	championData.abilities = await analyseTools.cleanAbilities(championData.abilities);
//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells
await (async function analysePrecudure() {
	console.log('analysing done:\t\t', procedure[2]);
})();
