//import getBaseData from './lol_scraper/baseData.js';

import * as tools from './tools/tools.js';
import * as scraper from './lol_scraper/scraper.js';
import * as extractor from './lol_extractor/extractor.js';
import * as analyser from './lol_analyser/analyser.js';
import * as calculator from './lol_calculator/calculator.js';

export let procedure = {
	useTestData: 0,
	//champions: [10, 24, 46, 63, 66, 76, 77, 78, 88, 101, 124, 133, 151],
	championsAssortment: [0],
	scraper: {
		createLists: 0,
		getBaseData: 0,
		createBaseChampionDataSet: 0,
		getAbilitiesData: 0,
		getInGameData: 0,
		getItemData: 0,
		createSelfDescribingDataStructure: 0,
		createBackup: 0,
	},
	extractor: {
		renewData: 1,
		exMetaData: 0,
		exText: 0,
		exSkillTabs: 1,
		exSpecialScaling: 1,
		specialScalingToSkillTabs: 0,
		exSpecialScaling: 0,
		exSkillOrder: 0,
		exMasteries: 0,
		objectsToArrays: 0,
		exItems: 0,
		createBackup: 0,
	},
	analyser: {
		renewData: 1,
		unifyAbilityMarkers: 1,
		skillTabsToArray: 1,
		cleanSkillTabMarkers: 1,
		categorizeMarkers: 1,
		unifyItems: 1,
		showAllMarkerPositions: 1,
		createBackup: 1,
	},
	calculator: {
		renewData: 1,
		singleChampion: 1,
		matchup: 1,
		createBackup: 1,
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
	if (procedure.scraper.createLists) await scraper.createLists();

	//list of champions and there baseStats for every single one
	if (procedure.scraper.getBaseData) await scraper.getBaseData();

	//creates single jsonFiles for every champion which is getting filled, to start wich,  with the concerning base data
	if (procedure.scraper.createBaseChampionDataSet) await scraper.createBaseChampionDataSet();

	// champion abilities data
	if (procedure.scraper.getAbilitiesData) await scraper.getAbilitiesData();

	// skillorder, items, masteries
	if (procedure.scraper.getInGameData) await scraper.getInGameData();

	// everyItem independent from the champions, SCRAPPING + EXTRACT
	if (procedure.scraper.getItemData) await scraper.getItemData();

	if (procedure.scraper.createSelfDescribingDataStructure) await scraper.createSelfDescribingDataStructure();

	//creates a backup from the current data in .data for champions&items
	if (procedure.scraper.createBackup) await scraper.createBackup();

	console.log('scrapping done:\n', procedure.scraper);
	console.log('\n----------------------');
})();

//extractor zieht nur die Daten raus analyzer zieht schlüsse, z.B.: weite damage range eines spells, lösche bestimmte spells etc.
await (async function extractProcedure() {
	/**extractor only adds information by categorization
	 * analyser also modifies data!?!
	 */

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
	if (procedure.extractor.renewData) await extractor.renewData();
	if (procedure.extractor.exMetaData) await extractor.exMetaData();
	//TODO: saves it in a way thus it cant be reruned, current workaround by reseting the data everytime, maybe just do kind of error handling
	if (procedure.extractor.exText) await extractor.exText();
	if (procedure.extractor.exSkillTabs) await extractor.exSkillTabs();

	//TODO: structure/double
	//TODO: analyse concerning Skills (is a concerning skill a trigger or is it empowered) and or markedPassages
	if (procedure.extractor.exSpecialScaling) await extractor.exSpecialScaling();
	if (procedure.extractor.specialScalingToSkillTabs) await extractor.specialScalingToSkillTabs();

	//TODO: structure/double
	if (procedure.analyser.unifyAbilityMarkers) await analyser.unifyAbilityMarkers();
	if (procedure.analyser.categorizeMarkers) await analyser.categorizeMarkers();
	if (procedure.analyser.cleanSkillTabMarkers) await analyser.deleteAndCleanMarkers();
	if (procedure.analyser.showAllMarkerPositions) await analyser.showAllMarkerPositions();

	//extract usual individual stuff
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
	/**reduces the abilities to the necessary math */
	if (procedure.analyser.renewData) await analyser.renewData();
	//delete unessessary markers (minion damage etc, not maximum)

	//TODO: für morgen oder so - mal die ganzen marker opperationen sortieren, strukturieren, zusammenfassen, mögliche dopplungen entfernen und sortieren
	// analyser.handleAbilityMarkers()

	//TODO: structure/double
	if (procedure.analyser.skillTabsToArray) await analyser.skillTabsToArray();
	if (procedure.extractor.objectsToArrays) await extractor.objectsToArrays();

	if (procedure.analyser.unifyItems) await analyser.unifyItems();
	if (procedure.analyser.createBackup) await analyser.createBackup();

	console.log('analysing done:\n', procedure.analyser);
})();

await (async function calculatorProcedure() {
	if (procedure.calculator.renewData) await calculator.renewData();
	if (procedure.calculator.singleChampion) await calculator.singleChampion();
	if (procedure.calculator.matchup) await calculator.matchup();
	if (procedure.calculator.createBackup) await calculator.createBackup();

	console.log('calculating done:\n', procedure.calculator);
})();
