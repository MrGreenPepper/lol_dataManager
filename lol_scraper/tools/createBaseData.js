import * as tools from '../../tools.js';

export async function createBaseChampionDataPool() {
	console.log('_______________________\n');
	console.log('creating baseDataPool start\n');
	const championList = await tools.getChampionList();
	const baseData = await tools.loadJSONData('./lol_scraper/data/baseData.json');

	try {
		for (let championEntry of championList) {
			let championData = {};

			try {
				championData = await tools.loadJSONData(`./data/champions/${championEntry.championSaveName}_data.json`);
			} catch {}
			championData.name = championEntry.championName;
			//generate base structure if not existing
			if (!championData.hasOwnProperty('scraped_data')) {
				championData.scraped_data = {};
				championData.scraped_data.baseData = {};
			}
			championData.scraped_data.baseData.baseStats = baseData[championEntry.championSaveName];

			//save	the	origin	data
			tools.saveJSONData(championData, `./lol_scraper/data/champions/baseData/${championEntry.championSaveName}_data.json`);

			//save the data for later merge
			tools.saveJSONData(championData, `./data/champions/${championEntry.championSaveName}_data.json`);
		}
	} catch (err) {
		console.error(err);
		tools.reportError('creating baseData', championData.name, err.message);
	}
	console.log('creating baseData pool done\n');
	console.log('---------------------------\n');

	return;
}
