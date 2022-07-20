import * as tools from '../tools.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSkillOrder() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
			console.log('\n\t', championName);
			//first load the data
			let championData = await tools.loadJSONData(
				`./data/champions/${championName}_data.json`
			);

			championData = await extractSkillOrder(championData);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillOrder.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skillOrder extraction failed at champion: ', championName);
			tools.reportError('skillOrder extraction failed', championName, err.message, err.stack);
		}
	}
}

async function extractSkillOrder(championData) {
	let scrapedSkillOrder = [...championData.scraped_data.inGameData.skillOrder];
	let qOrder = scrapedSkillOrder.slice(0, 18);
	let wOrder = scrapedSkillOrder.slice(18, 36);
	let eOrder = scrapedSkillOrder.slice(36, 54);
	let rOrder = scrapedSkillOrder.slice(54, 72);
	let skillOrder = [];
	for (let i = 0; i < 18; i++) {
		if (qOrder[i] != '') {
			skillOrder.push('Q');
		}
		if (wOrder[i] != '') {
			skillOrder.push('W');
		}
		if (eOrder[i] != '') {
			skillOrder.push('E');
		}
		if (rOrder[i] != '') {
			skillOrder.push('R');
		}
	}
	championData.extracted_data.inGameData.skillOrder = skillOrder;
	return championData;
}
