//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
import * as tools from '../tools.js';
import scraperTools from '../scraper/scraperTools';
import extractorTools from './extractorTools';
import fs from 'fs';
import skillTabs from './skillTabs';
import metaData from './metaData';
import skillOrder from './skillOrder';

export default function extractor() {
	let championList = tools.getChampionList();

	const ex_skillTabs = function () {
		for (let championName of championList) {
			try {
				//first load the data
				let championData = await tools.loadJSONData(`./lol_scraper/data/champion_inGameData`);
	
				championData = await skillTabs.extractSkillTabs(championData);
	
				await saveChampionData(championData);
			} catch (err) {
				console.log(err);
				console.log('skilltab extraction failed at champion: ', championName);
			}
		}
		
	};
	const ex_metaData = function () {};
	const ex_skillOrder = function () {};
	const ex_masteries = function () {};
}
async function extractChampionData() {
	/** Loads the concated data from the champions and trys to divide the text strings into markers and mathData.
	 * Afterwards saves the data into championName_extractedData.json
	 *
	 */
	let championList = await getChampionList();
	// let championList = ['Kindred'];
	for (let championName of championList) {
		try {
			//first load the data
			let championData = await getChampionRawData(championName);

			championData = await skillTabs.extractSkillTabs(championData);
			championData = await metaData.extractMetaData(championData);
			championData = await skillOrder.extractSkillOrder(championData);
			//championData = textContent.extractTextContent(championData);

			await saveChampionData(championData);
		} catch (err) {
			console.log(err);
			console.log('extraction failed at champion: ', championName);
		}
	}
	return;
}

function getChampionList() {
	return new Promise((resolve) => {
		let loadPath = `../lol_scraper/extractor/data/championList.json`;
		let championList = JSON.parse(fs.readFileSync(loadPath, 'utf8'));
		resolve(championList);
	});
}

async function getChampionRawData(championName) {
	try {
		// console.log(require('path').resolve('../lol_scraper/extractor/data/data.json'));
		let loadPath = `../lol_scraper/extractor/data/${championName}_concatData.json`;
		championData = JSON.parse(fs.readFileSync(loadPath), 'utf8');
		return championData;
	} catch (err) {
		console.log(err);
		console.log('cant get raw championData from: \t', championName);
	}
}

async function saveChampionData(championData) {
	let championName = championData.name;
	let savePath = `./extractor/data/${championName}_extractedData.json`;
	fs.writeFileSync(savePath, JSON.stringify(championData), function (err, result) {
		if (err) {
			console.log(`"\x1b[31m" ${championName} "\x1b[0m" - failed to save extraceted Data `);
			console.log(err.message);
		}
	});

	return;
}

module.exports = { extractChampionData };
