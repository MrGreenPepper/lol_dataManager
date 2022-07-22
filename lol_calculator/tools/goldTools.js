import * as itemTools from './itemTools.js';

let levelWaves = [0, 2, 3, 4, 6, 9, 11, 14, 18, 21, 25, 30, 34, 39, 45, 49, 54, 60];

let averageGoldPerWave = [
	[1, 125],
	[28, 147],
	[34, 150],
	[49, 195],
];

function goldPerMinute(championLevel) {
	/** calculates, base on the championLevel, the inGame time and the concerning goldPerMinute
	 * the goldClock is 1:50 behind the inGame time
	 * 		- starting at 1:50 --> 20.4 gold per 10 seconds
	 * 		- a wave every 30 seconds
	 * 		--> after the first wave additionaly 61.2 gold per Wave
	 */
	let gold = 0;
	if (championLevel > 1) {
		let wavesPassed = levelWaves[championLevel];
		let goldClock = wavesPassed - 1;
		gold = 61.2 * goldClock;
		return gold;
	} else return gold;
}

export async function getGoldAmount(championLevel, perfectionScore = 1) {
	let waveCount = levelWaves[championLevel];
	let goldAmount = 500;

	for (let i = 1; i <= waveCount; i++) {
		let goldPerWave = 125;
		for (let n = 0; n < 3 && i >= averageGoldPerWave[n + 1][0]; n++) {
			goldPerWave = averageGoldPerWave[n + 1][1];
		}
		goldAmount += goldPerWave * perfectionScore;
	}
	goldAmount += goldPerMinute(championLevel);
	return goldAmount;
}

export async function alreadyPayed(newItem, boughtItems) {
	let alreadySpend = 0;
	let boughtItemsNames = boughtItems.map((item) => {
		return item.name;
	});
	//first check if there is any recipe to go with
	if (newItem.recipe.buildPath == undefined || newItem.recipe.buildPath.length == 0) {
		return 0;
	}
	//now get the itemBuildingPath and compare them with the already bought ones

	let buildingPathItems = newItem.recipe.buildPath;
	alreadySpend = boughtItems.map((bItem) => {
		for (let i = 0; i < buildingPathItems.length; i++) {
			if (bItem.name == buildingPathItems[i]) {
				return itemTools.getItemPrice(bItem);
			} else {
				return 0;
			}
		}
	});
	alreadySpend = await Promise.all(alreadySpend);
	alreadySpend = alreadySpend.reduce((acc = 0, price) => {
		if (price == undefined) return acc + 0;
		return acc + price;
	});
	return alreadySpend;
}
