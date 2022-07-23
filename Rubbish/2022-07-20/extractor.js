//TODO: moved extractor to the analyser ... need to test the basic scraper again import fs from 'fs';
import * as tools from '../tools.js';
//import scraperTools from '../scraper/scraperTools';
//import extractorTools from './extractorTools';
import fs from 'fs';
import * as skillTabs from './skillTabs.js';
import * as metaData from './metaData.js';
import * as skillOrder from './skillOrder.js';

export default async function extractor() {
	let championList = tools.getChampionList();

	const ex_skillTabs = async function () {
		for (let championName of championList) {
			try {
				//first load the data
				let championData = await tools.loadJSONData(
					`./lol_scraper/data/champion_inGameData`
				);

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
