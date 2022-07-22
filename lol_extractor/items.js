import * as tools from '../tools.js';
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
	let itemList = await tools.getItemList();
	for (let itemName of itemList) {
		try {
			let rawData = await tools.loadJSONData(
				`./lol_scraper/data/items/${itemName}_data.json`
			);
			let itemData = rawData;
			try {
				console.table(rawData.stats.values);
				itemData = await extractStats(rawData);
				console.table(itemData.stats.values);
			} catch (error) {
				console.log(error);
			}
			try {
				itemData = await extractRecipe(itemData);
			} catch (error) {
				console.log(error);
			}
			await tools.saveJSONData(itemData, `./data/items/${itemName}_data.json`);
			await tools.saveJSONData(itemData, `./lol_extractor/data/items/${itemName}_data.json`);
		} catch (err) {
			tools.reportError('extracting itemData failed', itemName, err.message, err.stack);
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
