import fs from 'fs';
import puppeteer from 'puppeteer';
import { procedure } from './dataManager.js';

export async function saveJSONData(data, url) {
	await fs.writeFileSync(url, JSON.stringify(data), 'utf-8');
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
	url = decodeURIComponent(url);
	let data = await fs.readFileSync(url, 'utf-8');
	return JSON.parse(data);
}

export async function loadCSVData(url) {
	let csvData = [];
	let csvDataString = fs.readFileSync(url, 'utf-8');
	let rows = csvDataString.split('\n');
	for (let i = 0; i < rows.length; i++) {
		csvData.push(rows[i].split(','));
	}
	csvData = csvData.filter((currentElement) => !currentElement[0] == '');
	return csvData;
}

export async function getChampionList() {
	let championList = await loadJSONData('./data/championLinks.json');
	// if length is 2 its a range otherwise its a list of champions
	if (procedure.champions.length == 2) {
		championList = championList.filter((element, index) => {
			if (procedure.champions[0] <= index && index <= procedure.champions[1]) return true;
			else return false;
		});
	} else {
		championList = championList.filter((element, index) => {
			if (procedure.champions.includes(index)) return true;
			else return false;
		});
	}
	return championList;
}

export async function getItemLinkList() {
	let linkList = await loadJSONData('./data/itemLinkList.json');
	return linkList;
}
export async function reportError(category, championName, errorMessage, errorStack) {
	let errorLog = await loadCSVData('./errorLog.csv');
	errorMessage = errorMessage.replaceAll('\n', 'N');
	errorMessage = errorMessage.replaceAll(',', '.');

	//check if error already has been logged
	let alreadyLogged = false;
	let currentErrorArray = [category, championName, errorMessage, errorStack];
	errorLog.map((currentElement) => {
		if (arraysEqual(currentElement, currentErrorArray)) alreadyLogged = true;
	});
	if (!alreadyLogged) errorLog.push(currentErrorArray);
	await saveCSVData(errorLog, './errorLog.csv');
	return;
}

export function fileSystemNameConverter(itemName) {
	try {
		//TODO:

		itemName = itemName.replaceAll(' ', '');
		itemName = itemName.replaceAll('"', '');
		itemName = itemName.replaceAll("'", '');
		if (itemName == 'BladeofTheRuinedKing') {
			itemName = 'BladeoftheRuinedKing';
		}
	} catch (err) {
		console.log(err);
		reportError('cant modify itemName', itemName, err.message, err.stack);
	}
	return itemName;
}

function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;

	// If you don't care about the order of the elements inside
	// the array, you should sort both arrays here.
	// Please note that calling sort on an array will modify that array.
	// you might want to clone your array first.

	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

export async function applyToAllSkillTabs(skillTabs, applyFunction) {
	/** applies a function to every single skillTab
	 *
	 * @param {object} skillTabs - kind of array out of skillTabs in form of an object
	 * @param {function} applyFunction - function which is applied to every single skillTab
	 *
	 * @returns {object} skillTabs - modified skillTabsArray
	 */
	let abilityKeys = Object.keys(skillTabs);
	try {
		for (let i of abilityKeys) {
			let currentAbility = skillTabs[i];
			for (let n = 0; n < currentAbility.length; n++) {
				let currentContent = currentAbility[n];
				for (let c = 0; c < currentContent.length; c++) {
					skillTabs[i][n][c] = await applyFunction(currentContent[c]);
				}
			}
		}
	} catch (err) {
		console.log(err);
		console.log(skillTabs);
	}

	return skillTabs;
}

export function timer() {
	return new Promise((resolve, reject) => {
		setTimeout((res) => resolve(), 500);
	});
}
export function basicStringClean(toCleanUp) {
	let cleanedString;
	if (Array.isArray(toCleanUp)) {
		cleanedString = [];
		for (let rawString of toCleanUp) {
			rawString = rawString.toLowerCase();
			rawString = rawString.replaceAll('−', '-');
			rawString = rawString.replaceAll('」', ' ');
			rawString = rawString.replaceAll('「', ' ');
			rawString = rawString.replaceAll(/\n/gim, ' ');
			rawString = rawString.replaceAll('  ', ' '); //doubleSpace
			rawString = rawString.replaceAll('	', ' '); //tab
			rawString = rawString.replaceAll('_', ' '); //tab
			rawString = rawString.trim();
			cleanedString.push(rawString);
		}
	} else {
		toCleanUp = toCleanUp.toLowerCase();
		toCleanUp = toCleanUp.replaceAll('−', '-');
		toCleanUp = toCleanUp.replaceAll('」', ' ');
		toCleanUp = toCleanUp.replaceAll('「', ' ');
		toCleanUp = toCleanUp.replaceAll(/\n/gim, ' ');
		toCleanUp = toCleanUp.replaceAll('  ', ' '); //doubleSpace
		toCleanUp = toCleanUp.replaceAll('	', ' '); //tab
		toCleanUp = toCleanUp.replaceAll('_', ' '); //tab
		toCleanUp = toCleanUp.trim();
		cleanedString = toCleanUp;
	}
	return cleanedString;
}
export function toBasicRegex(wordComb) {
	/**tests if the input as an array or a single string --> everything to regex --> returns array or string */
	let regexExpr;
	if (Array.isArray(wordComb)) {
		regexExpr = [];
		for (let currentWord of wordComb) {
			let regexArray = currentWord.split(' ');
			let regExString = '';
			for (let i = 0; i < regexArray.length; i++) {
				regExString += '(' + regexArray[i] + ').*?';
			}

			regexExpr.push(new RegExp(regExString, 'gim'));
		}
	} else {
		let regexArray = wordComb.split(' ');
		regexExpr = '';
		for (let i = 0; i < regexArray.length; i++) {
			regexExpr += '(' + regexArray[i] + ').*?';
		}

		regexExpr = new RegExp(regexExpr, 'gim');
	}
	return regexExpr;
}
