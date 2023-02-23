import { startBrowser } from './tools/browserControl.js';
import Puppeteer from 'puppeteer';
import * as tools from '../tools/tools.js';

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

	//tableContent - get the data
	let tableContent = await page.$$eval('table tbody tr td', (tds) => tds.map((td) => td.innerText));
	tableContent = transformTable(tableContent);

	//get the inGameNames
	let inGameNames = tableContent.filter((currentElement) => typeof currentElement == 'string');
	inGameNames = inGameNames.filter((currentElement) => !currentElement.includes('·'));

	//sorting the right values to the right keys
	let baseData = assignData(tableContent, tableHeader, inGameNames);

	await tools.fileSystem.saveJSONData(baseData, './lol_scraper/data/baseData.json');

	await browser.close();

	console.log('scrapping baseData done\n');
	console.log('-----------------------\n');
	return;
}

function assignData(tableContent, sortingKeys, inGameNames) {
	let baseData = {};
	let championCount = inGameNames.length;
	let keysCount = sortingKeys.length;

	for (let i = 0; i < championCount; i++) {
		let inGameName = inGameNames[i];

		baseData[inGameName] = {};

		for (let k = 1; k < keysCount; k++) {
			let arrayPosition = i * keysCount + k;
			baseData[inGameName][sortingKeys[k]] = tableContent[arrayPosition];
		}
	}

	return baseData;
}

/**erase unnecessary signs and parse strings to numbers if possible
 * @param 	[array] rawDataTable  	-	the content to clean
 * @returns	[array] rawDataTable 	-	cleaned content
 */
function transformTable(rawDataTable) {
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
