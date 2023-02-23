import * as tools from '../tools/tools.js';

const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSkillOrder() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;
		try {
			console.log('\n\t', inGameName);
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${inGameName}_data.json`);

			championData = await extractSkillOrder(championData);

			await tools.fileSystem.saveJSONData(championData, `${LOGSAVEPATH}${inGameName}_skillOrder.json`);
			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${inGameName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skillOrder extraction failed at champion: ', inGameName);
			tools.bugfixing.reportError('skillOrder extraction failed', inGameName, err.message, err.stack);
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
