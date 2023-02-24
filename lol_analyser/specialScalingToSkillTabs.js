import * as tools from '../tools/tools.js';

export async function specialScalingToSkillTabs() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystemName;
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);

		let abilityData = championData.analysed_data.abilities;

		for (let i = 0; i < abilityData.length; i++) {
			//TODO:
			//			ability = transfromSpecialScalingTabs(abilityData[i]);
		}
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${championEntry.fileSystemName}`);
	}
}

function transfromSpecialScalingTabs(ability) {}
