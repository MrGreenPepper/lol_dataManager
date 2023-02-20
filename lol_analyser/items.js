import * as tools from '../tools.js';

export async function unifyItems() {
	let itemList = await tools.getItemList();
	for (let itemEntry of itemList) {
		let fileSystemName = itemEntry['fileSystemName'];
		try {
			let loadName = tools.fileSystemNameConverter(fileSystemName);
			let itemData = await tools.loadJSONData(`./data/items/${loadName}`);
			try {
				if (Object.keys(itemData.stats).length > 0)
					itemData.stats.values = await unifyItemMarker(itemData.stats.values);
			} catch (error) {
				console.log(error);
			}

			await tools.saveJSONData(itemData, `./data/items/${loadName}`);
			await tools.saveJSONData(itemData, `./lol_analyser/data/items/${loadName}`);
		} catch (err) {
			tools.reportError('lol_analyser - items.js: unify itemData failed', fileSystemName, err.message, err.stack);
			console.log('lol_analyser - items.js: unify itemData failed', fileSystemName, err.message, err.stack);
			console.log(fileSystemName);
			console.log(err.message);
			console.log(err.stack);
		}
	}

	//return itemData;
}
async function unifyItemMarker(itemDataStats) {
	//TODO: vereinheitlichen von allen unify methods
	itemDataStats = itemDataStats.map((currentStat) => {
		switch (true) {
			case currentStat[1].includes('Lethality'):
				return [currentStat[0], 'lethality'];

			default:
				return currentStat;
		}
	});
	return itemDataStats;
}
