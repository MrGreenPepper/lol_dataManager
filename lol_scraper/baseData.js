import { startBrowser } from './tools/browserControl.js';
import Puppeteer from 'puppeteer';
import * as tools from '../tools.js';

export async function getBaseData() {
	console.log('_______________________\n');
	console.log('scrapping baseData start');
	let url_baseStats = 'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';

	const browser = await startBrowser();
	const page = await browser.newPage();
	page.goto(url_baseStats);
	await page.waitForNavigation();

	//tableHeader - for Keys
	let tableHeader = await page.$eval('table thead', (tds) => tds.innerText);
	tableHeader = tableHeader.split('\t');
	tableHeader = tableHeader.map((currentElement) => currentElement.replaceAll('\n', ''));
	tableHeader = tableHeader.map((currentElement) => currentElement.toLowerCase());
	tableHeader = tableHeader.map((currentElement) => currentElement.replaceAll('+', '_plus'));

	//tableContent
	let tableContent = await page.$$eval('table tr td', (tds) => tds.map((td) => td.innerText));
	tableContent = cleanTable(tableContent);

	//get the championNames
	let championNames = tableContent.filter((currentElement) => typeof currentElement == 'string');
	championNames = championNames.filter((currentElement) => !currentElement.includes('·'));
	let championCount = championNames.length;

	//sorting the right values to the right keys
	let baseData = assignData(tableContent, tableHeader, championNames);

	await tools.saveJSONData(baseData, './lol_scraper/data/baseData.json');
	await tools.saveJSONData(championNames, './lol_scraper/data/championList.json');

	//get the championLinks
	let links = await page.evaluate(() => {
		let linksRaw = document.querySelectorAll('table tr td a');
		let links = [];
		for (let i = 0; i < linksRaw.length; i++) {
			links.push([linksRaw[i].innerText, linksRaw[i].getAttribute('href')]);
		}
		console.log(links);
		//links = links.map((element) => element.getAttribute('href'));
		return links;
	});

	links = links.filter((element) => typeof element[0] == 'string' && element[0] != '');
	links = links.filter((element) => /(wiki).*(LoL)/.test(element[1]));
	links.forEach((element, index) => {
		element[1] = 'https://leagueoflegends.fandom.com' + element[1];
		element.push(championNames[index]);
	});

	await browser.close();
	tools.saveJSONData(links, './data/championLinks.json');

	console.log('scrapping baseData done\n');
	console.log('-----------------------\n');
	return;
}

function assignData(tableContent, sortingKeys, championNames) {
	let baseData = {};
	let championCount = championNames.length;
	let keysCount = sortingKeys.length;

	for (let i = 0; i < championCount; i++) {
		let championName = championNames[i];

		baseData[championName] = {};

		for (let k = 1; k < keysCount; k++) {
			let arrayPosition = i * keysCount + k;
			baseData[championName][sortingKeys[k]] = tableContent[arrayPosition];
		}
	}

	return baseData;
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

/*
	let rawData = await page.evaluate(() => {
		//	const testTable = document.getElementById('div.table-wide-inner');
		//	console.log(testTable);
		//const tds = Array.from(document.querySelectorAll('table tr td'));
		const tds = document.querySelectorAll('table tr td');
		//console.log(tds);
		return tds;
		return tds.map((td) => td.innerText);
	});
	*/
