//import getBaseData from './lol_scraper/baseData.js';

import * as tools from './tools.js';
import * as markerTools from './lol_analyzer/marker/markerTools.js';
import * as extractor from './lol_extractor/extractor.js';
import * as scraper from './lol_scraper/scraper.js';

let procedure = [
	[0, 0, 0, 0, 0, 0],
	[1, 0, 0, 0],
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
	if (procedure[1][0] == true) await extractor.exMetaData();
	if (procedure[1][1] == true) await extractor.exSkillTabs();
	if (procedure[1][2] == true) await extractor.exSkillOrder();
	if (procedure[1][3] == true) await extractor.exMasteries();
	//	await extractor.extractChampionData();
	//	await extractor.getTheFormulaData();
	console.log('extracting	done:\t\t', procedure[1]);
})();

await (async function analysePrecudure() {
	/**loads the championData and controls the anlyse sequence
	 * analyse sequence:
	 * 1. load the championDatat

	 * 3. cleanUp the abilitiesData
	 * 4. unify markers
	 * 5. checks if there are any unknown markers
	 * 6. summaries and the abilities and their markers
	 * 7. saves the data
	 */

	let championList = await tools.loadJSONData('./lol_scraper/data/championList.json');

	for (let championName of championList) {
		//i know the objects returns arent necessary but I like them for a cleaner structure
		//1.
		let championData = await tools.loadJSONData(
			`./lol_scraper/data/champions/inGameData/${championName}_data.json`
		);

		//metaNumbers to float;
		championData.extracted_data.baseData.abilities = await markerTools.metaNumbersToFloat(
			championData.scraped_data.baseData.abilities
		);
		//2.1
		championData.abilities.skillTabs = await markerTools.createSkillTabArray(
			championData.abilities
		);
		//all mathStrings to Math;
		// championData.abilities = await markerTools.allStringsToMath(championData.abilities);
		//3.
		championData.abilities = await analyseTools.cleanAbilities(championData.abilities);
		//4.
		championData.abilities = await unifyMarkers.start(championData.abilities);

		//5.
		await checkMarkers.start(championData.abilities);

		//5.2
		await markerTools.showAllMarkerPositions(championData.abilities);
		//6.
		championData.abilities = await summariesAbilities.start(championData.abilities);
		//7.
		analyseTools.saveData(championData);
	}

	console.log('analysing done:\t\t', procedure[2]);
})();
