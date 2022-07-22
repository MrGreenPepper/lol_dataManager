import fs from 'fs';
import * as goldTools from './goldTools.js';
import * as tools from '../../tools.js';
const ITEMBASEPATH = './data/items/';
export async function loadItems(itemNames) {
	let itemData = {};
	let startItemsNames = itemNames.start;
	let bootsName = itemNames.boots;
	let coreNames = itemNames.core;
	let endNames = itemNames.end;
	let firstBackNames = itemNames.firstBackItem;

	itemData.boots = await loadItemData(bootsName);
	itemData.startItems = startItemsNames.map(async (item) => {
		return await loadItemData(item);
	});
	itemData.startItems = await Promise.all(itemData.startItems);

	itemData.coreItems = coreNames.map(async (item) => {
		return await loadItemData(item);
	});
	itemData.coreItems = await Promise.all(itemData.coreItems);

	itemData.firstBackItems = firstBackNames.map(async (item) => {
		return await loadItemData(item);
	});
	itemData.firstBackItems = await Promise.all(itemData.firstBackItems);

	itemData.endItems = endNames.map(async (item) => {
		return await loadItemData(item);
	});
	itemData.endItems = await Promise.all(itemData.endItems);

	return itemData;
}

function loadItemData(itemName) {
	return new Promise((resolve, reject) => {
		let loadName = tools.itemNameConverter(itemName);

		try {
			let loadPath = `${ITEMBASEPATH}${loadName}_data.json`;
			//loadPath = `./data/items/BladeoftheRuinedKing_data.json`;
			//console.log(loadPath);
			let itemData = JSON.parse(fs.readFileSync(loadPath, { encoding: 'utf-8' }));
			resolve(itemData);
		} catch (error) {
			console.error('\ncant load item: \t', itemName, '\n', error);
			reject(error);
		}
	});
}

async function getItemPrice(item) {
	try {
		let recipe = item.recipe;
		let recipeKeys = Object.keys(item.recipe);
		let itemCosts = 0;
		for (let key of recipeKeys) {
			try {
				for (let i = 0; i < recipe[key].length; i++) {
					if (recipe[key][i].includes('Cost')) itemCosts = recipe[key][i][1];
				}
			} catch (err) {}
		}

		if (itemCosts.includes('Special')) {
			return 0;
		} else {
			itemCosts = itemCosts.trim();
			itemCosts = parseInt(itemCosts);

			return itemCosts;
		}
	} catch (err) {
		console.log('cant get recipe:\t', item);
		tools.reportError('cant get recipe', item, err.message, err.stack);
		console.log(err);
		//throw err;
	}
}

async function getPartedItems(itemList) {
	let higherItems = [];
	let partedItems = [];
	let buildPathItems = [];
	//* takes an item or an itemList  and returns a list of all containing items
	//1. if it isnt an array put the item into one
	try {
		if (!Array.isArray(itemList)) {
			itemList = [itemList];
		}
		//get all all containing items from the list
		console.log(error);

		//check which items have a buildingPath

		higherItems = itemList.filter((currentItem) => {
			return (
				currentItem.recipe.buildPath != undefined && currentItem.recipe.buildPath.length > 0
			);
		});

		let buildPathItemNamesTemp = higherItems.map((item) => {
			return item.recipe.buildPath;
		});
		let buildPathItemNames = [];

		buildPathItemNamesTemp.map((itemArray) => {
			buildPathItemNames.push(...itemArray);
		});
		buildPathItems = buildPathItemNames.map((itemName) => {
			return loadItemData(itemName);
		});
		buildPathItems = await Promise.all([...buildPathItems]);
		//

		//push the containing items to the result array
		partedItems.push(buildPathItems);
		//test if there are still "higher class items in the list" --> y --> repeat
		higherItems = buildPathItems.filter((currentItem) => {
			return (
				currentItem.recipe.buildPath != undefined && currentItem.recipe.buildPath.length > 0
			);
		});
		if (higherItems.length > 0) {
			let moreItems = await getPartedItems(higherItems);
			partedItems.push(...moreItems);
			return partedItems;
		} else {
			return partedItems;
		}
	} catch (error) {
		// console.log(error);
		return partedItems;
	}
}

function getBoots(itemOrder) {
	/** sorts out the boots Item from a given list of items
	 * criteria is the boots basic item in the buildingPath
	 * @param {array} 	itemOrder
	 */
	return new Promise((resolve) => {
		let boots = itemOrder.filter((item) => {
			try {
				if (item.recipe.buildPath.includes('Boots')) return true;
				else return false;
			} catch {
				return false;
			}
		});

		if (boots.length == 1) {
			boots = boots[0];
			resolve(boots);
		} else {
			//	console.lo;g('error can identify unique boots in itemOrder');
			resolve(undefined);
		}
	});
}

export async function calculateItems(itemOrder, goldAmount) {
	// console.log('------------------------------------------------');
	let soldOut = false;
	let boughtItems = [];
	let partedBuy;
	let boots = await getBoots(itemOrder);
	for (let i = 0; i < itemOrder.length && soldOut == false; i++) {
		let currentItem = itemOrder[i];
		/** checks if different kinds of buys are possible, if one buy is possible the goldAmount will be corrected and 
		the new item is pushed to the boughtItem array, otherwise the next cheaper buy is tried

		if no buy is possible soldOut is set to true, to prevent buying a partedItem from a fullItem further down the list
		*/
		let currentBuy = await checkBuyFullItem(boughtItems, currentItem, goldAmount)
			.catch((failedFullBuy) => {
				//console.log('fullBuy failed ', failedFullBuy[1].name);
				partedBuy = checkPartedBuy(...failedFullBuy);
				soldOut = true;
				return partedBuy;
			})

			.catch((failedPartedBuy) => {
				// console.log('partBuy failed failed ', failedPartedBuy);
				return failedPartedBuy;
			})

			.then((lastBuy) => {
				// console.log('currentBuy: \t', lastBuy[0]);
				return lastBuy;
			});

		boughtItems = currentBuy[0];
		goldAmount = currentBuy[2];
	}
	let bootsBuy = await checkBootsBuy(boughtItems, boots, goldAmount);
	boughtItems = bootsBuy[0];
	//console.log('boughtItems: \t', boughtItems);
	return boughtItems;
}

async function checkBuyFullItem(boughtItems, item, goldAmount) {
	//t2 boots already bought check otherwise buy them like a normal item
	try {
		let test1 = await getBoots(boughtItems);
		let test2 = await getBoots([item]);
		if (test1 != undefined && test2 != undefined)
			return Promise.resolve([boughtItems, item, goldAmount]);
		let itemPrice = await getItemPrice(item);
		if (itemPrice <= goldAmount) {
			boughtItems.push(item);
			return Promise.resolve([boughtItems, item, goldAmount - itemPrice]);
		} else return Promise.reject([boughtItems, item, goldAmount]);
	} catch (error) {
		console.log('\n cant check fullbuy on item: \t', item);
		console.log(error);
		return Promise.reject([boughtItems, item, goldAmount]);
	}
}

async function checkPartedBuy(boughtItems, item, goldAmount) {
	/** first try getting parted Items:
	 * 		-> then get their prices, then sort the items from expensive to cheap and try to buy them in this order
	 *		-> if there are no parted items return a rejection 
	 @return	{Promise.resolve(array)}	[boughtItems, item, goldAmount]
	 @return	{Promise.resolve(array)}	[boughtItems, item, goldAmount]
	 
	 */
	try {
		//TODO: calculate optimal buy,
		/** f.e.: at the moment I just buy from expensive to cheap, but if we have 1200
		 * git would be argumently better to buy one item for 800 + 400 instead of one item for
		 * 1100 cause I spend more money over all???
		 *
		 * further more would it be better to buy armor against ad champs etc..
		 */

		let partedItemsTemp = await getPartedItems(item);
		let partedItems = [];
		partedItemsTemp.map((currentArray) => {
			partedItems.push(...currentArray);
		});

		partedItems = await partedItems.map(async (partedItem) => {
			let itemPrice = await getItemPrice(partedItem);
			return [partedItem, itemPrice];
		});
		partedItems = await Promise.all([...partedItems]);
		partedItems = partedItems.sort((a, b) => {
			if (a[1] < b[1]) return 1;
			if (a[1] > b[1]) return -1;
			if ((a[1] = b[1])) return 0;
		});

		for (let i = 0; i < partedItems.length; i++) {
			if (partedItems[i][1] <= goldAmount) {
				boughtItems.push(partedItems[i][0]);
				goldAmount -= partedItems[i][1];
			}
		}

		return Promise.resolve([boughtItems, item, goldAmount]);
	} catch (err) {
		console.log(err);
		return Promise.reject([boughtItems, item, goldAmount]);
	}
}

async function checkBootsBuy(boughtItems, boots, goldAmount) {
	let itemsValue = await getItemsValue(boughtItems);

	if (itemsValue > 2500) {
		try {
			let fullBuy = await checkBuyFullItem(boughtItems, boots, goldAmount);
			return fullBuy;
		} catch (failedFullBuy) {
			let boughtBoots = boughtItems.filter((item) => {
				if (item.name == 'Boots') return true;
				else return false;
			});
			if (boughtBoots.length == 0) {
				return await checkPartedBuy(boughtItems, boots, goldAmount)
					.then((succesFullPartedBuy) => {
						return succesFullPartedBuy;
					})
					.catch((failedPartedBuy) => {
						return failedPartedBuy;
					});
			} else {
				return [boughtItems, boots, goldAmount];
			}
		}
	} else {
		//check if t1 boots already bought as part of the parted buy of t2 boots
		let boughtBoots = boughtItems.filter((item) => {
			if (item.name == 'Boots') return true;
			else return false;
		});
		if (boughtBoots.length == 0) {
			return await checkPartedBuy(boughtItems, boots, goldAmount)
				.then((succesFullPartedBuy) => {
					return succesFullPartedBuy;
				})
				.catch((failedPartedBuy) => {
					return failedPartedBuy;
				});
		} else {
			return [boughtItems, boots, goldAmount];
		}
	}
}

async function getItemsValue(itemArray) {
	let itemSum = await itemArray.reduce(async (acc, item) => {
		let accu = await acc;
		let itemPrice = await getItemPrice(item);
		return accu + itemPrice;
	}, 0);

	return itemSum;
}

export async function sumItemStats(boughtItems) {
	//TODO: calculate itemConsums and itemActives
	let summedStats = [];
	//first sort out the items with stats
	let items = boughtItems.filter((currentItem) => {
		try {
			let itemStats = currentItem.stats.values;
			if (itemStats.length > 0) return true;
			else return false;
		} catch (err) {
			return false;
		}
	});
	//now sort out all stats
	let itemStats = items.map((currentItem) => {
		return currentItem.stats.values;
	});
	itemStats = itemStats.reduce((acc, currentArray) => {
		return acc.concat(currentArray);
	}, []);

	//unify all stats markers
	itemStats = await unifyStats(itemStats);
	//summ similar stats
	let alreadyUsedStats = [];
	for (let i = 0; i < itemStats.length; i++) {
		let currentStatType = itemStats[i][1];
		if (!alreadyUsedStats.includes(currentStatType)) {
			let oneStatOnlyArray = itemStats.filter((currentStat) => {
				if (currentStat[1] == currentStatType) return true;
				else return false;
			});
			let sumStat = oneStatOnlyArray.reduce((acc, currentArray) => {
				//if (currentArray[0].includes('%')) return acc + currentArray[0];
				//else return acc + parseInt(currentArray[0]);
				return acc + currentArray[0];
			}, 0);
			summedStats.push([sumStat, currentStatType]);
			alreadyUsedStats.push(currentStatType);
		}
	}
	summedStats = statsToObject(summedStats);
	return summedStats;
}
function statsToObject(summedStatsArray) {
	let statsObj = {};
	for (let i = 0; i < summedStatsArray.length; i++) {
		let currentStat = summedStatsArray[i];
		switch (currentStat[1]) {
			case 'attack damage':
				statsObj.ad = currentStat[0];
				break;
			case 'health':
				statsObj.hp = currentStat[0];
				break;
			case 'ability haste':
				statsObj.cd = currentStat[0];
				break;
			case '% movement speed':
				statsObj.ms_percent = currentStat[0];
				break;
			case 'movement speed':
				statsObj.ms = currentStat[0];
				break;
			case 'armor':
				statsObj.armor = currentStat[0];
				break;
			case 'magic resistance':
				statsObj.magicResist = currentStat[0];
				break;
			case '% critical strike chance':
				statsObj.crit = currentStat[0];
				break;
			case '% attack speed':
				statsObj.attackSpeed_percent = currentStat[0];
				break;
			case 'magic penetration':
				statsObj.magicPenetration = currentStat[0];
				break;
			case '% magic penetration':
				statsObj.magicPenetration_percent = currentStat[0];
				break;
			case 'ability power':
				statsObj.ap = currentStat[0];
				break;
			case '% base health regeneration':
				statsObj.hp5_percent = currentStat[0];
				break;
			case 'health per 5 seconds':
				statsObj.hp5 = currentStat[0];
				break;
			case '% life steal':
				statsObj.lifeSteal_percent = currentStat[0];
				break;
			case '% omnivamp':
				statsObj.omnivamp_percent = currentStat[0];
				break;
			case '% heal and shield power':
				statsObj.extraHP_percent = currentStat[0];
				break;
			case 'lethality':
				statsObj.lethality = currentStat[0];
				break;
			case '% armor penetration':
				statsObj.armorPenetration_percent = currentStat[0];
				break;
			default:
				console.log(
					'%cERROR - statsToObject: didnt found statMarker --> gonna drop it:\t',
					'color: red',
					currentStat
				);
		}
	}
	return statsObj;
}
async function unifyStats(itemStatsArray) {
	//TODO: research on the 'per 10 seconds" marker
	let ignoreMarkers = ['mana', 'per 10 seconds', 'against monster', 'summoner spell'];
	//first unify the numbers % etc.

	itemStatsArray = itemStatsArray.map((currentArray) => {
		if (currentArray[0].includes('%')) {
			currentArray[0] = currentArray[0].replace('%', '');
			currentArray[1] = '% ' + currentArray[1];
		}
		return [currentArray[0], currentArray[1]];
	});
	// set the ignore markers
	itemStatsArray = itemStatsArray.filter((currentArray) => {
		let toogle = true;
		for (let i = 0; i < ignoreMarkers.length; i++) {
			if (currentArray[1].includes(ignoreMarkers[i])) toogle = false;
		}
		return toogle;
	});
	//all numberStrings to numbers
	itemStatsArray = itemStatsArray.map((currentArray) => {
		return [parseInt(currentArray[0]), currentArray[1]];
	});
	//second unify the markers
	return itemStatsArray;
}
