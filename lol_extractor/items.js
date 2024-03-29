import * as tools from '../tools/tools.js';
import * as markerTools from './marker/markerTools.js';

async function extractData() {
	let itemList = await tools.loadItemList();
	for (item of itemList) {
		try {
			let itemRawData = await tools.loadRawData(item);
			itemData = await extract.extractItemData(itemRawData);
			await tools.saveData(itemData);
		} catch (err) {
			console.log(err);
		}
	}
}

export async function exItems() {
	let itemList = await tools.looping.getItemList();
	for (let item of itemList) {
		try {
			let loadName = item['fileSystemName'];
			let rawData = await tools.fileSystem.loadJSONData(`./lol_scraper/data/items/${loadName}`);
			let itemData = rawData;
			try {
				if (Object.keys(itemData.stats).length > 0) {
					itemData = await extractStats(rawData);
					//		console.table(itemData.stats.values);
				} else {
					itemData.stats = {};
				}

				if (Object.keys(itemData.recipe).length > 0) {
					itemData = await extractRecipe(rawData);
					//		console.table(itemData.stats.values);
				} else {
					itemData.recipe = {};
				}
			} catch (error) {
				console.log(error);
			}
			await tools.fileSystem.saveJSONData(itemData, `./data/items/${loadName}`);
			await tools.fileSystem.saveJSONData(itemData, `./lol_extractor/data/items/${loadName}`);
		} catch (err) {
			console.log(err);
			tools.bugfixing.reportError('extracting itemData failed', item, err.message, err.stack);
		}
	}

	//return itemData;
}

async function extractStats(rawData) {
	let rawValues = rawData.stats.values;

	let itemValues = rawValues.map((rawStats) => {
		let numberEnd = 0;
		let stats = [];
		rawStats = rawStats.trim();
		let textToogle = false;
		for (let i = 0; i < rawStats.length; i++) {
			//i is gonna be updated as long as the string contains math
			if (markerTools.isItMath(rawStats[i]) && textToogle == false) {
				numberEnd = i;
			}
			//need the next line for "every 5 seconds" in text --> the 5 would update the numberPointer at the wrong position
			if (markerTools.isItText(rawStats[i])) textToogle = true;
		}
		//if a number was found then slice afterwards
		if (numberEnd != 0) numberEnd++;
		stats[0] = rawStats.slice(0, numberEnd);
		stats[1] = rawStats.slice(numberEnd);

		stats[0] = stats[0].replace(/\+/g, '');

		stats[0] = stats[0].trim();
		stats[1] = stats[1].trim();
		return stats;
	});

	rawData.stats.origin = rawData.stats.values;
	rawData.stats.values = itemValues;
	return rawData;
}

async function extractRecipe(itemData) {
	//first test if there is a recipe part
	let includesRecipe = false;
	let dataKeys = Object.keys(itemData.recipe);
	let htmlText = '';
	for (let key of dataKeys) {
		let rKeys = Object.keys(itemData.recipe[key]);
		if (rKeys.includes('originHTML')) {
			includesRecipe = true;
			htmlText = itemData.recipe[key].originHTML;
		}
	}

	if (!includesRecipe) return itemData;
	else {
		htmlText = htmlText.trim();
		let dataInto = htmlText.includes('data');
		let htmlParts = [];
		let splitPosition = 0;
		while (htmlText.includes('data')) {
			splitPosition = htmlText.indexOf('data');
			htmlText = htmlText.slice(splitPosition + 4);
			splitPosition = htmlText.indexOf('data');
			htmlParts.push('data ' + htmlText.slice(0, splitPosition));
			htmlText = htmlText.slice(splitPosition);
		}
		return itemData;
	}
}
