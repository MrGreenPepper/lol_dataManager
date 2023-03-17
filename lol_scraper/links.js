import * as tools from '../tools/tools.js';
import { startBrowser } from './tools/browserControl.js';
import puppeteer from 'puppeteer';

export async function createLists() {
	await createChampionList();
	await createItemList();
}
export async function createChampionList() {
	/**1. abilityLinks
	 * 2. inGameLinks
	 * 3. merge Data in oneList
	 */
	let linkList = [];
	const url_baseStats = 'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';
	const url_leagueofgraphs = 'https://www.leagueofgraphs.com/champions/builds';
	const browser = await startBrowser();
	const page = await browser.newPage();
	page.goto(url_baseStats);
	await page.waitForNavigation();

	/*ABILITIES*/
	//tableContent
	let tableContent = await page.$$eval('table tr td', (tds) => tds.map((td) => td.innerText));
	tableContent = cleanTable(tableContent);

	//get the championNames
	let championNames_wiki = tableContent.filter((currentElement) => typeof currentElement == 'string');
	championNames_wiki = championNames_wiki.filter((currentElement) => !currentElement.includes('·'));
	//championNames_wiki includes doubles like 'kled' & 'kled&skarl' cause we scrap the names from the baseStatsTable and they have different baseStats

	let wikiLinks = await page.evaluate(() => {
		let linksRaw = document.querySelectorAll('table tr td a');
		let links = [];
		for (let i = 0; i < linksRaw.length; i++) {
			links.push({ inGameName: linksRaw[i].innerText, wikiLink: linksRaw[i].getAttribute('href') });
		}
		console.log(links);
		return links;
	});

	//filter dataSets with incorrect inGameName values
	wikiLinks = wikiLinks.filter((dataSet) => typeof dataSet.inGameName == 'string' && dataSet.inGameName != '');
	//filter dataSets with incorrect wikiLinks
	let linkStructure = /(wiki).*(LoL)/;
	wikiLinks = wikiLinks.filter((dataSet) => linkStructure.test(dataSet.wikiLink));
	wikiLinks.forEach((championEntry) => {
		championEntry.wikiLink = 'https://leagueoflegends.fandom.com' + championEntry.wikiLink;
		championEntry.identifier = tools.dataSet.createIdentifier(championEntry.inGameName);
	});

	/*INGAME*/

	page.goto(url_leagueofgraphs);
	await page.waitForNavigation();

	let leagueOfGraphsLinks = await page.$$eval('table.data_table tr a', (tableLinks) => {
		console.log(tableLinks);
		let championLinks = [];
		for (let i = 0; i < tableLinks.length; i++) {
			try {
				let test = tableLinks[i].querySelector('img');
				if (test) {
					let link = tableLinks[i].getAttribute('href');
					let champName = test.getAttribute('alt');
					championLinks.push({ url: link, inGameName: champName });
				}
			} catch {}
		}
		console.log('championlinks', championLinks);
		return championLinks;
	});
	await browser.close();

	leagueOfGraphsLinks.forEach((championEntry) => {
		championEntry.identifier = tools.dataSet.createIdentifier(championEntry.inGameName);
		championEntry.url = 'https://www.leagueofgraphs.com' + championEntry.url;
	});

	//merge the linkLists

	for (let i = 0; i < wikiLinks.length; i++) {
		let linkSet = {};

		linkSet.inGameName = wikiLinks[i].inGameName;
		linkSet.identifier = wikiLinks[i].identifier;
		linkSet.fileSystemName = linkSet.identifier + '.json';
		linkSet.index = i;

		linkSet.internetLinks = {};
		linkSet.internetLinks.wiki = wikiLinks[i].wikiLink;
		try {
			linkSet.internetLinks.leagueOfGraphs = findTheMatchingDataSet(linkSet.identifier, leagueOfGraphsLinks).url;
			linkList.push(linkSet);
		} catch (error) {
			console.log(error);
			console.log('cant find matching championData for:', linkSet);
		}
	}

	tools.fileSystem.saveJSONData(linkList, './data/championList.json');
}

function findTheMatchingDataSet(wikiIdentifier, dataBase) {
	let matchingDataSet;

	//TODO: are this exceptions (gnar&kled) correct?
	switch (wikiIdentifier) {
		case 'megagnar':
			wikiIdentifier = 'gnar';
			break;
		case 'kledskaarl':
			wikiIdentifier = 'kled';
			break;
	}

	for (let dataSet of dataBase) {
		if (dataSet.identifier == wikiIdentifier) matchingDataSet = dataSet;
	}

	return matchingDataSet;
}

function cleanTable(rawDataTable) {
	//cleans unnecessary signs
	rawDataTable = rawDataTable.map((currentElement) => {
		currentElement = currentElement.replace(/\s/g, '');
		currentElement = currentElement.replaceAll('+', '');
		if (currentElement.includes('%')) {
			currentElement = currentElement.replace('%', '');
			currentElement = parseFloat(currentElement);
			currentElement = currentElement / 100;
		}
		//parse all numbers
		if (!isNaN(parseFloat(currentElement))) currentElement = parseFloat(currentElement);

		return currentElement;
	});

	return rawDataTable;
}

async function createItemList() {
	let url_itemList = 'https://leagueoflegends.fandom.com/wiki/List_of_items';
	let itemList = [];
	let browser = await puppeteer.launch();
	//let browser = await puppeteer.launch({ headless: false });
	let page = await browser.newPage();
	let fileSystemName;

	await page.goto(url_itemList);

	itemList = await page.evaluate((tools) => {
		try {
			let element = document.getElementById('stickyMenuWrapper');
			let dtElements = element.querySelectorAll('dt');
			console.log(dtElements);
			console.log(element);
			let listContainer = element.querySelectorAll('div#stickyMenuWrapper div.tlist a, dt');

			console.log(listContainer);
			let contentEnd = false;
			// sort out all unecessary items
			listContainer = Array.prototype.filter.call(listContainer, (currentElement) => {
				try {
					if (currentElement.innerText.includes('Ornn')) contentEnd = true;
				} catch (e) {}
				return !contentEnd;
			});
			//sort out the markers, previously used for cutting unecessary items out

			listContainer = Array.prototype.filter.call(listContainer, (currentElement) => {
				console.log(currentElement.localName);
				if (currentElement.localName == 'dt') return false;
				else return true;
			});
			console.log(listContainer);
			let linkList = [];

			for (element of listContainer) {
				let itemName = element.querySelector('img');
				itemName = itemName.getAttribute('alt');
				itemName = itemName.replace('.png', '');
				itemName = itemName.replace(/item/g, '');
				itemName = itemName.replace(/Item/g, '');
				itemName = itemName.replace(/\)/g, '');
				itemName = itemName.replace(/\(/g, '');
				itemName = itemName.trim();

				// console.log(itemName);

				linkList.push({ inGameName: itemName, internetLink: element.href });
			}
			return linkList;
		} catch (err) {
			console.log(err);
		}
	});
	await browser.close();

	for (let item of itemList) {
		fileSystemName = tools.dataSet.createIdentifier(item.inGameName) + '.json';
		item.fileSystemName = fileSystemName;
	}
	// console.log('bp');
	await tools.fileSystem.saveJSONData(itemList, './data/itemList.json');
}
