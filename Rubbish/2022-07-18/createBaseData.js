import * as scraperTools from '../../tools.js';

export async function createBaseChampionDataPool() {
	const championList = await scraperTools.loadJSONData('./lol_scraper/data/championList.json');
	const baseData = await scraperTools.loadJSONData('./lol_scraper/data/baseData.json');

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
			championData.scraped_data.inGameData.skillsOrder = {};
			championData.scraped_data.inGameData.masteries = {};

			championData.extracted_data = {};
			championData.extracted_data.baseData = {};
			championData.extracted_data.baseData.baseStats = {};
			championData.extracted_data.baseData.abilities = {};
			championData.extracted_data.inGameData = {};
			championData.extracted_data.inGameData.items = {};
			championData.extracted_data.inGameData.skillsOrder = {};
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

			saveJSONData(
				championData,
				`./lol_scraper/data/champion_baseData/${championData.name}_data.json`
			);
		}
	} catch (err) {
		console.error(err);
		scraperTools.reportError('creating baseData', championData.name, err.message);
	}
	return;
}
