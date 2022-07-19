import * as tools from '../tools.js';

const LOGSAVEPATH = './lol_extractor/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSkillOrder() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		try {
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
		}
	}
}

async function extractSkillOrder(championData) {
	let qOrder = championData.abilities.skillsOrder.slice(0, 18);
	let wOrder = championData.abilities.skillsOrder.slice(18, 36);
	let eOrder = championData.abilities.skillsOrder.slice(36, 54);
	let rOrder = championData.abilities.skillsOrder.slice(54, 72);
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
	championData.abilities.skillsOrder = skillOrder;
	return championData;
}
