import * as tools from '../tools/tools.js';

export async function specialScalingToSkillTabs() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${inGameName}_data.json`);

		let abilityData = championData.analysed_data.abilities;

		for (let i = 0; i < abilityData.length; i++) {
			//			ability = transfromSpecialScalingTabs(abilityData[i]);
		}
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${inGameName}_data.json`);
	}
}

function transfromSpecialScalingTabs(ability) {}
