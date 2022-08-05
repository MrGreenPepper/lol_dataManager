import * as tools from '../tools.js';
const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';

export async function exSpecialScaling() {
	/**specialScalings arent % ... they get in place when certain limits are cracked */
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		//	console.log('\x1b[31m', champEntry.championName, '\x1b[0m');
		console.log(champEntry.championName, '\t', champEntry.index);
		try {
			//first load the data
			let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

			/** TASKS */
			championData.extracted_data.baseData.abilities = await specialScalingOnMeta(championData);
			//championData.extracted_data.baseData.abilities = await specialScalingOnChampionsPassive(championData);
			//		championData.extracted_data.baseData.abilities = await specialScalingOnActives(championData);

			//		await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillTabs.json`);
			//		await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
}

function specialScalingOnMeta(championData) {
	/** transforms the the special scalings in metaData to kinda 'traditional' metaSkillTabs */
	//check for specialScaling parts
	for (let i = 0; i < 5; i++) {
		let ability = championData.extracted_data.baseData.abilities[i];
		// check meta for specialScaling
		let metaKeys = Object.keys(ability.metaData);
		/**specialScaling meta */
		for (let m in metaKeys) {
			let metaData = ability.metaData[metaKeys[m]];
			if (metaData.hasOwnProperty('specialScaling')) {
				let specialKeys = Object.keys(metaData.specialScaling);
				let specialTab = {};
				/*let specialTab = [];
				if(specialKeys.length > 1) console.log('\n\n\nMORE THAN ONE SPECIALVALUE IN METADATA\n\n\n');
				for (let sKey of specialKeys) {
				let specialData = metaData.specialScaling[sKey];*/
				let specialData = metaData.specialScaling[0];
				let flatValues = specialData.botValues.split(';').map((value) => Number(value));
				let scalingType = specialData.text.slice(specialData.text.indexOf('(') + 1, specialData.text.indexOf(')')).toLowerCase();
				let scalingValue;
				if (specialData.hasOwnProperty('topValues')) {
					scalingValue = specialData.topValues.split(';').map((value) => Number(value));
					specialTab.scalingValue = scalingValue;
				}
				specialTab.flatValues = flatValues;
				specialTab.scalingType = scalingType;
				metaData.specialScaling = true;
				metaData.specialTab = specialTab;
			}
		}
	}

	//check for the specialScalingTabs in the text to confirm and sort  out possible wrong ones

	return championData;
}

function specialScalingOnChampionsPassive(championData) {
	let specialTabs = [];

	let scalingKeys = Object.keys(specialScalings);
	for (let key of scalingKeys) {
		let specialSkillTab;
		let flatPart;
		let empowers;
		let levelLimiterValues;
		let levelLimiterType;
		let scalingPart = specialScalings[key];
		let scalings = []; //[[scalingPart, scalingPartType]]

		//get the flatPart
		flatPart = scalingPart.botValues.split(';');
		//	flatPartType = scalingPart.text.slice(scalingPart.text.indexOf('('), scalingPart.text.indexOf(')'))
		if (scalingPart.topLabel.length > 0) {
			let scalingPartType = scalingPart.topLabel;
			let scalingValues = scalingPart.topValues;
			scalings;
		}
	}

	return skillTab;
}
