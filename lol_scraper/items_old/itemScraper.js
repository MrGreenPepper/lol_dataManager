const tools = require('./tools');
const extract = require('./extract');
async function start() {
	// await scrapeData();
	await extractData();
}

async function scrapeData() {
	let itemLinkList = await tools.getItemList();
	// let itemLinkList = [
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Plated_Steelcaps'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Prowler%27s_Claw'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Boots_of_Swiftness'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Mercury%27s_Treads'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Mobility_Boots'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Ionian_Boots_of_Lucidity'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Aegis_of_the_Legion'],
	// 	[, 'https://leagueoflegends.fandom.com/wiki/Bami%27s_Cinder'],
	// ];
	let itemRawData = {};
	let itemData = {};
	let itemDataList = [];
	for (link of itemLinkList) {
		try {
			itemRawData = await tools.getItemData(link);
			try {
				if (
					itemRawData.recipe.combineCosts.length > 0 &&
					itemRawData.recipe.buildPath.length == 0
				) {
					await timer();
					itemRawData = await tools.getItemData(link);
					await tools.saveRawData(itemRawData);
					// } else {
					// 	await tools.saveRawData(itemRawData);
					// 	itemDataList.push(itemRawData.name);
				}
			} catch (e) {
				await tools.saveRawData(itemRawData);
				itemDataList.push(itemRawData.name);
			}

			await tools.saveRawData(itemRawData);
			itemDataList.push(itemRawData.name);
		} catch (err) {
			console.log(err);
			console.log(link);
		}
	}
	await tools.saveItemList(itemDataList);
}

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

function timer() {
	return new Promise((resolve, reject) => {
		setTimeout((res) => resolve(), 500);
	});
}
start();
