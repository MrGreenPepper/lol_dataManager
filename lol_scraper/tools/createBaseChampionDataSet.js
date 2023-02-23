import * as tools from '../../tools/tools.js';

export async function createBaseChampionDataSet() {
	console.log('_______________________\n');
	console.log('creating baseDataPool start\n');
	const championList = await tools.looping.getChampionList();
	const baseData = await tools.fileSystem.loadJSONData('./lol_scraper/data/baseData.json');

	try {
		for (let championEntry of championList) {
			let championData = {};

			try {
				championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);
			} catch {}
			championData.inGameName = championEntry.inGameName;
			//generate base structure if not existing
			if (!championData.hasOwnProperty('scraped_data')) {
				championData.scraped_data = {};
				championData.scraped_data.baseData = {};
			}

			//championData.scraped_data.baseStats = baseData[championEntry.inGameName];
			championData.scraped_data.baseStats = baseData[championEntry.identifier];
			championData.scraped_data.baseData = {};
			championData.scraped_data.abilities = {};

			//save	the	origin	data
			tools.fileSystem.saveJSONData(
				championData,
				`./lol_scraper/data/champions/baseData/${championEntry.fileSystenName}`
			);

			//save the data for later merge
			tools.fileSystem.saveJSONData(championData, `./data/champions/${championEntry.fileSystenName}`);
		}
	} catch (err) {
		console.error(err);
		tools.bugfixing.reportError('creating baseData', err.message);
	}
	console.log('creating baseData pool done\n');
	console.log('---------------------------\n');

	return;
}
