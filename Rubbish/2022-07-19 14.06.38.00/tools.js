import fs from 'fs';
import { startBrowser } from './lol_scraper/tools/browserControl.js';

export async function saveJSONData(data, url) {
	await fs.writeFileSync(url, JSON.stringify(data));
	return;
}

export async function mergeData(newData) {
	let dataSet_name = newData.name;
	let oldData = await loadJSONData(`./data/champions/${dataSet_name}`);

	let currentData = { ...oldData, newData };
	await saveJSONData(currentData, `./data/champions/${dataSet_name}`);
	return;
}
export async function saveCSVData(data, url) {
	let dataCSVString = '';

	//	let header = data[0].reduce((current, past) => past + ',' + current);
	//	dataCSVString += header + '\n';
	for (let rowNumber = 0; rowNumber < data.length; rowNumber++) {
		let currentRow = data[rowNumber];
		dataCSVString += currentRow.reduce((current, past) => current + ',' + past);
		dataCSVString += '\n';
	}
	await fs.writeFileSync(url, dataCSVString, 'utf-8');
	return;
}

export async function loadJSONData(url) {
	let data = await fs.readFileSync(url, 'utf-8');
	return JSON.parse(data);
}

export async function loadCSVData(url) {
	let csvData = [];
	let csvDataString = await fs.readFileSync(url, 'utf-8');
	let rows = csvDataString.split('\n');
	for (let i = 0; i < rows.length; i++) {
		csvData.push(rows[i].split(','));
	}
	csvData = csvData.filter((currentElement) => !currentElement[0] == '');
	return csvData;
}

export async function getChampionList() {
	let championList = await loadJSONData('./lol_scraper/data/championList.json');
	return championList;
}

export async function reportError(category, championName, errorMessage) {
	let errorLog = await loadCSVData('./errorLog.csv');
	errorMessage = errorMessage.replaceAll('\n', 'N');
	errorMessage = errorMessage.replaceAll(',', '.');

	//check if error already has been logged
	let alreadyLogged = false;
	let currentErrorArray = [category, championName, errorMessage];
	errorLog.map((currentElement) => {
		if (arraysEqual(currentElement, currentErrorArray)) alreadyLogged = true;
	});
	if (!alreadyLogged) errorLog.push(currentErrorArray);
	await saveCSVData(errorLog, './errorLog.csv');
	return;
}

function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

export async function getItemList() {
	let url_itemList = 'https://leagueoflegends.fandom.com/wiki/List_of_items';
	let itemLinkList = [];
	let browser = await startBrowser();
	let page = await browser.newPage();

	await page.goto(url_itemList);

	let rawData = await page.evaluate(() => {
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
	return rawData;
}
