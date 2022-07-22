import * as tools from '../tools.js';

export async function unifyItems() {
	let itemList = await tools.getItemList();
	for (let itemName of itemList) {
		try {
			let loadName = tools.itemNameConverter(itemName);
			let itemData = await tools.loadJSONData(`./data/items/${loadName}_data.json`);
			try {
				console.table(itemData.stats.values);
				itemData.stats.values = await unifyMarkers(itemData.stats.values);
			} catch (error) {
				console.log(error);
			}

			await tools.saveJSONData(itemData, `./data/items/${loadName}_data.json`);
			await tools.saveJSONData(itemData, `./lol_analyser/data/items/${loadName}_data.json`);
		} catch (err) {
			tools.reportError(
				'lol_analyser - items.js: unify itemData failed',
				itemName,
				err.message,
				err.stack
			);
			console.log(
				'lol_analyser - items.js: unify itemData failed',
				itemName,
				err.message,
				err.stack
			);
			console.log(itemName);
			console.log(err.message);
			console.log(err.stack);
		}
	}

	//return itemData;
}

async function unifyMarkers(itemDataStats) {
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
