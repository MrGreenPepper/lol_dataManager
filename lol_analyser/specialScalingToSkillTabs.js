import * as tools from '../tools.js';

export async function specialScalingToSkillTabs() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

		let abilityData = championData.analysed_data.baseData.abilities;

		for (let i = 0; i < abilityData.length; i++) {
			//			ability = transfromSpecialScalingTabs(abilityData[i]);
		}
		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

function transfromSpecialScalingTabs(ability) {}
