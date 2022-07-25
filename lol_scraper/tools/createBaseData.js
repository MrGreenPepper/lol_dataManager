import * as tools from '../../tools.js';

export async function createBaseChampionDataPool() {
	console.log('_______________________\n');
	console.log('creating baseDataPool start\n');
	const championList = await tools.getChampionList();
	const baseData = await tools.loadJSONData('./lol_scraper/data/baseData.json');

	try {
		for (let i = 0; i < championList.length; i++) {
			let championData = {};
			championData.name = championList[i].championName;
			//generate base structure
			championData.scraped_data = {};
			championData.scraped_data.baseData = {};
			championData.scraped_data.baseData.baseStats = {};
			championData.scraped_data.baseData.baseStats = baseData[championList[i]];
			championData.scraped_data.baseData.abilities = {};
			championData.scraped_data.inGameData = {};
			championData.scraped_data.inGameData.items = {};
			championData.scraped_data.inGameData.skillOrder = {};
			championData.scraped_data.inGameData.masteries = {};

			championData.extracted_data = {};
			championData.extracted_data.baseData = {};
			championData.extracted_data.baseData.baseStats = {};
			championData.extracted_data.baseData.abilities = {};
			championData.extracted_data.inGameData = {};
			championData.extracted_data.inGameData.items = {};
			championData.extracted_data.inGameData.skillOrder = {};
			championData.extracted_data.inGameData.masteries = {};
			championData.extracted_data.inGameData.summonerSpells = {};

			championData.calculated_data = {};

			//save	the	origin	data
			tools.saveJSONData(
				championData,
				`./lol_scraper/data/champions/baseData/${championList[i].championSaveName}_data.json`
			);

			//save the data for later merge
			tools.saveJSONData(
				championData,
				`./data/champions/${championList[i].championSaveName}_data.json`
			);
		}
	} catch (err) {
		console.error(err);
		tools.reportError('creating baseData', championData.name, err.message);
	}
	console.log('creating baseData pool done\n');
	console.log('---------------------------\n');

	return;
}
