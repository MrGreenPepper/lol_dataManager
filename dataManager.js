//import getBaseData from './lol_scraper/baseData.js';

import * as tools from './tools.js';
import * as markerTools from './lol_analyser/marker/markerTools.js';
import * as scraper from './lol_scraper/scraper.js';
import * as extractor from './lol_extractor/extractor.js';
import * as analyser from './lol_analyser/analyser.js';
import * as calculator from './lol_calculator/calculator.js';

export let procedure = {
	useTestData: 0,
	scraper: {
		getBaseData: 0,
		createBaseChampionPool: 0,
		getAbilitiesData: 0,
		getInGameData: 0,
		getItemData: 0,
		createBackup: 0,
	},
	extractor: {
		resetData: 0,
		exMetaData: 0,
		exSkillTabs: 0,
		exSkillOrder: 0,
		exMasteries: 0,
		exItems: 0,
		createBackup: 0,
	},
	analyser: {
		resetData: 0,
		cleanSkillTabMarkers: 0,
		simplifyAbilities: 0,
		unifyItems: 0,
		showAllMarkerPositions: 0,
		createBackup: 0,
	},
	calculator: {
		resetData: 1,
		singleChampion: 1,
		matchup: 0,
		createBackup: 0,
	},
};
/**dataStorage:
 * every step saves the data twice ... once in the mainData folder and once in the minorData folder of the concerning program
 * every step opens the data from the mainData folder - the minor folder in every program is just kinda log
 *
 * the reset() functions:
 * overides the data of the current program with the data from the last program
 */

await (async function scrappingProcedure() {
	//list of champions and there baseStats for every single one
	if (procedure.scraper.getBaseData) await scraper.getBaseData();

	//creates single jsonFiles for every champion which is getting filled, to start wich,  with the concerning base data
	if (procedure.scraper.createBaseChampionPool) await scraper.createBaseChampionDataPool();

	// champion abilities data
	if (procedure.scraper.getAbilitiesData) await scraper.getAbilitiesData();

	// skillorder, items, masteries
	if (procedure.scraper.getInGameData) await scraper.getInGameData();

	// everyItem independent from the champions, SCRAPPING + EXTRACT
	if (procedure.scraper.getItemData) await scraper.getItemData();

	//creates a backup from the current data in .data for champions&items
	if (procedure.scraper.createBackup) await scraper.createBackup();

	console.log('scrapping done:\n', procedure.scraper);
	console.log('\n----------------------');
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
	if (procedure.extractor.resetData) await extractor.resetData();
	if (procedure.extractor.exMetaData) await extractor.exMetaData();
	//TODO: saves it in a way thus it cant be reruned, current workaround by reseting the data everytime, maybe just do kind of error handling
	if (procedure.extractor.exSkillTabs) await extractor.exSkillTabs();
	if (procedure.extractor.exSkillOrder) await extractor.exSkillOrder();
	//TODO: masteries
	if (procedure.extractor.exMasteries) await extractor.exMasteries();
	//TODO: items
	if (procedure.extractor.exItems) await extractor.exItems();
	if (procedure.extractor.createBackup) await extractor.createBackup();

	console.log('extracting done:\n', procedure.extractor);
	console.log('\n----------------------');
})();

//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells, lösche bestimmte spells etc.
await (async function analyseProcedure() {
	if (procedure.analyser.resetData) await analyser.resetData();
	if (procedure.analyser.cleanSkillTabMarkers) await analyser.cleanSkillTabMarkers();
	if (procedure.analyser.simplifyAbilities) await analyser.simplifyAbilities();
	if (procedure.analyser.unifyItems) await analyser.unifyItems();
	if (procedure.analyser.showAllMarkerPositions) await analyser.showAllMarkerPositions();
	if (procedure.analyser.createBackup) await analyser.createBackup();

	console.log('analysing done:\n', procedure.analyser);
})();

await (async function calculatorProcedure() {
	if (procedure.calculator.resetData) await calculator.resetData();
	if (procedure.calculator.singleChampion) await calculator.singleChampion();
	if (procedure.calculator.matchup) await calculator.matchup();
	if (procedure.calculator.createBackup) await calculator.createBackup();

	console.log('calculating done:\n', procedure.calculator);
})();
