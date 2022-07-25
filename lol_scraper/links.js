import * as tools from '../tools.js';
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
	const url_INGAMELINKS = 'https://www.leagueofgraphs.com/champions/builds';
	const browser = await startBrowser();
	const page = await browser.newPage();
	page.goto(url_baseStats);
	await page.waitForNavigation();

	/*ABILITIES*/
	//tableContent
	let tableContent = await page.$$eval('table tr td', (tds) => tds.map((td) => td.innerText));
	tableContent = cleanTable(tableContent);

	//get the championNames
	let championNames_ab = tableContent.filter((currentElement) => typeof currentElement == 'string');
	championNames_ab = championNames_ab.filter((currentElement) => !currentElement.includes('·'));

	let abilityLinks = await page.evaluate(() => {
		let linksRaw = document.querySelectorAll('table tr td a');
		let links = [];
		for (let i = 0; i < linksRaw.length; i++) {
			links.push([linksRaw[i].innerText, linksRaw[i].getAttribute('href')]);
		}
		console.log(links);
		return links;
	});

	abilityLinks = abilityLinks.filter((element) => typeof element[0] == 'string' && element[0] != '');
	abilityLinks = abilityLinks.filter((element) => /(wiki).*(LoL)/.test(element[1]));
	abilityLinks.forEach((element, index) => {
		element[1] = 'https://leagueoflegends.fandom.com' + element[1];
		element.push(championNames_ab[index]);
	});

	/*INGAME*/

	page.goto(url_INGAMELINKS);
	await page.waitForNavigation();

	let inGameLinksRaw = await page.evaluate(() => {
		let tableLinks = document.querySelectorAll('table.data_table tr a');
		console.log(tableLinks);
		let championLinks = [];
		for (let i = 0; i < tableLinks.length; i++) {
			try {
				let test = tableLinks[i].querySelector('img');
				if (test) {
					let link = tableLinks[i].getAttribute('href');
					let champName = test.getAttribute('alt');
					championLinks.push([link, champName]);
				}
			} catch {}
		}
		console.log('championlinks', championLinks);
		return championLinks;
	});
	inGameLinksRaw = inGameLinksRaw.sort((a, b) => {
		return a[1] > b[1] ? 1 : -1;
	});
	//double kled entry to match baseStats
	//fix gnar/megaGnar
	let inGameLinks = [];
	let indexOfGnar = -1;

	inGameLinksRaw = inGameLinksRaw.map((element, index) => {
		//save index of gnar for use at miss fortune (sort alphabetical g comes before m)
		if (element[1] == 'Gnar') indexOfGnar = index;
		switch (element[1]) {
			case 'Kled':
				inGameLinks.push(element);
				inGameLinks.push(element);
				break;
			case 'Miss Fortune':
				inGameLinks.push(inGameLinksRaw[indexOfGnar]);
				inGameLinks.push(element);
				break;
			default:
				inGameLinks.push(element);
		}
	});

	await browser.close();

	/*match the data*/
	for (let i = 0; i < abilityLinks.length; i++) {
		let linkSet = {};
		linkSet.inGameLink = 'https://www.leagueofgraphs.com' + inGameLinks[i][0];

		linkSet.championSaveName = championNames_ab[i];
		linkSet.championName = abilityLinks[i][0];
		linkSet.abilityLink = abilityLinks[i][1];
		linkSet.index = i;
		linkList.push(linkSet);
	}

	tools.saveJSONData(linkList, './data/championLinks.json');
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
	let itemLinkList = [];
	let browser = await puppeteer.launch();
	let page = await browser.newPage();

	await page.goto(url_itemList);

	itemLinkList = await page.evaluate(() => {
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

				linkList.push([itemName, element.href]);
			}
			return linkList;
		} catch (err) {
			console.log(err);
		}
	});
	// console.log('bp');
	await browser.close();
	await tools.saveJSONData(itemLinkList, './data/itemLinkList.json');
}
