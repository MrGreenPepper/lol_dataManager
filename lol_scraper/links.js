import * as tools from '../tools.js';
import { startBrowser } from './tools/browserControl.js';

export async function getLinks() {
	let linkList = [];
	const url_baseStats =
		'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';
	const url_INGAMELINKS = 'https://www.leagueofgraphs.com/champions/builds';
	const browser = await startBrowser();
	const page = await browser.newPage();
	page.goto(url_baseStats);
	await page.waitForNavigation();

	//tableContent
	let tableContent = await page.$$eval('table tr td', (tds) => tds.map((td) => td.innerText));
	tableContent = cleanTable(tableContent);

	//get the championNames
	let championNames = tableContent.filter((currentElement) => typeof currentElement == 'string');
	championNames = championNames.filter((currentElement) => !currentElement.includes('·'));
	let championCount = championNames.length;
	let abilityLinks = await page.evaluate(() => {
		let linksRaw = document.querySelectorAll('table tr td a');
		let links = [];
		for (let i = 0; i < linksRaw.length; i++) {
			links.push([linksRaw[i].innerText, linksRaw[i].getAttribute('href')]);
		}
		console.log(links);
		//links = links.map((element) => element.getAttribute('href'));
		return links;
	});

	abilityLinks = abilityLinks.filter(
		(element) => typeof element[0] == 'string' && element[0] != ''
	);
	abilityLinks = abilityLinks.filter((element) => /(wiki).*(LoL)/.test(element[1]));
	abilityLinks.forEach((element, index) => {
		element[1] = 'https://leagueoflegends.fandom.com' + element[1];
		element.push(championNames[index]);
	});

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
	inGameLinksRaw = inGameLinksRaw.map((element) => {
		switch (element[1]) {
			case 'Kled':
				inGameLinks.push(element);
				inGameLinks.push(element);
				break;
			case 'Miss Fortune':
				inGameLinks.push(inGameLinksRaw[36]);
				inGameLinks.push(element);
				break;
			default:
				inGameLinks.push(element);
		}
	});

	await browser.close();

	for (let i = 0; i < abilityLinks.length; i++) {
		let linkSet = {};
		linkSet.inGameLink = 'https://www.leagueofgraphs.com' + inGameLinks[i][0];

		linkSet.championSaveName = championNames[i];
		linkSet.championName = abilityLinks[i][0];
		linkSet.abilityLink = abilityLinks[i][1];
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
