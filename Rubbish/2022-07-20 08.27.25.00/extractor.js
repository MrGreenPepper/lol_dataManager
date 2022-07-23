//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
import * as tools from '../tools.js';
//import scraperTools from '../scraper/scraperTools';
//import extractorTools from './extractorTools';
import * as skillTabs from './skillTabs.js';
import * as metaData from './metaData.js';
import * as skillOrder from './skillOrder.js';
import * as masteries from './masteries.js';

const LOGSAVEPATH = './lol_extractor/champions';
const DATASAVEPATH = './data/champions';

export async function exSkillTabs() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await skillTabs.extractSkillTabs(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillTabs.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
}
export async function exMetaData() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await metaData.extractMetaData(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_metaData.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('metaData extraction failed at champion: ', championName);
		}
	}
}
export async function exSkillOrder() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await skillOrder.extractSkillOrder(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillOrder.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skillOrder extraction failed at champion: ', championName);
		}
	}
}
export async function exMasteries() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await extractMasteries(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_masteries.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('masteries extraction failed at champion: ', championName);
		}
	}
}

export async function extractChampionData() {
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

			//championData = textContent.extractTextContent(championData);

			await saveChampionData(championData);
		} catch (err) {
			console.log(err);
			console.log('extraction failed at champion: ', championName);
		}
	}
	return;
}
