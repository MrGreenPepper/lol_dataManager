import * as tools from '../../tools.js';

export async function createBaseChampionDataPool() {
	const championList = await tools.loadJSONData('./lol_scraper/data/championList.json');
	const baseData = await tools.loadJSONData('./lol_scraper/data/baseData.json');

	try {
		for (let i = 0; i < championList.length; i++) {
			let championData = {};
			championData.name = championList[i];
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
			for (let level = 0; level < 18; level++) {
				championData.calculated_data[level] = {};
				for (let ability = 0; ability < 5; ability++) {
					let abilityKey = 'ability' + ability;
					championData.calculated_data[level][abilityKey] = {};
					championData.calculated_data[level][abilityKey].damageRota = {};
					championData.calculated_data[level][abilityKey].dps = {};
				}
			}
			//save	the	origin	data
			tools.saveJSONData(
				championData,
				`./lol_scraper/data/champions/baseData/${championData.name}_data.json`
			);

			//save the data for later merge
			tools.saveJSONData(championData, `./data/champions/${championData.name}_data.json`);

			console.log('creating baseData pool done');
		}
	} catch (err) {
		console.error(err);
		tools.reportError('creating baseData', championData.name, err.message);
	}
	return;
}
