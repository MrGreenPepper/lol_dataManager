import { startBrowser } from './tools/browserControl.js';
import Puppeteer from 'puppeteer';
import * as tools from '../tools/tools.js';

export async function getBaseData() {
	console.log('_______________________\n');
	console.log('scrapping baseData start');
	let url_baseStats = 'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';

	const browser = await startBrowser();
	const page = await browser.newPage();
	try {
		page.goto(url_baseStats);
		await page.waitForNavigation();

		//tableHeader - for Keys
		let tableHeader = await page.$eval('table thead', (tds) => tds.innerText);
		tableHeader = tableHeader.split('\t');
		tableHeader = tableHeader.map((currentElement) => currentElement.replaceAll('\n', ''));
		tableHeader = tableHeader.map((currentElement) => currentElement.toLowerCase());
		let tableKeys = tableHeader.map((currentElement) => currentElement.replaceAll('+', '_plus'));

		//tableContent - get the data
		let tableContent = await page.$$eval('table tbody tr td', (tds) => tds.map((td) => td.innerText));
		tableContent = transformTable(tableContent);

		//sorting the right values to the right keys
		let baseData = generateBaseStatsTable(tableContent, tableKeys);

		await tools.fileSystem.saveJSONData(baseData, './lol_scraper/data/baseData.json');
	} catch (errer) {
		console.log(error);
		console.log('cant find baseData');
	}
	await browser.close();

	console.log('scrapping baseData done\n');
	console.log('-----------------------\n');
	return;
}

/**loops threw the table content until it cant complete a full dataSet */
function generateBaseStatsTable(tableContent, tableKeys) {
	let baseStatsTable = {};
	let keysCount = tableKeys.length;
	let reachedEndOfTheTable = false;
	let currentChampionData = {};
	let identifier;

	let i = 0;

	while (reachedEndOfTheTable == false) {
		currentChampionData = {};

		//loops until there is a key but no matching value (i is too high = 'reached end of the table')

		for (let [index, currentKey] of tableKeys.entries()) {
			//first tableKey is the championName
			if (index == 0) {
				identifier = tableContent[i];
				identifier = tools.dataSet.createIdentifier(identifier);
			} else if (tableContent[i] != undefined) {
				currentChampionData[currentKey] = tableContent[i];
			}
			i++;
		}

		//check if the dataSet is complete
		if (Object.keys(currentChampionData).length == tableKeys.length - 1)
			baseStatsTable[identifier] = currentChampionData;
		else reachedEndOfTheTable = true;
	}

	return baseStatsTable;
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
