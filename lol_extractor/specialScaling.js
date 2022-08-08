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
			championData = await specialScalingOnMeta(championData);
			championData = await specialScalingOnChampionsPassive(championData);
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
	let championPassive = championData.extracted_data.baseData.abilities[0];

	//get the abilityNames to get the skillTabs at the right part
	let abilityNames = [];
	for (let i = 0; i < 5; i++) {
		abilityNames.push(championData.extracted_data.baseData.abilities[i].name.replaceAll('_', ' ').toLowerCase());
	}
	//transfer the names to regex
	abilityNames = abilityNames.map((abilityname) => {
		let regexArray = abilityname.split(' ');
		let regexExpr = '';
		for (let i = 0; i < regexArray.length; i++) {
			regexExpr += '(' + regexArray[i] + ').?';
		}

		regexExpr = new RegExp(regexExpr, 'i');
		return regexExpr;
	});

	let text = {
		0: {
			text: 'some text',
			specialData: {
				0: 'some special Data',
				1: 'another special Data',
			},
		},
	};

	let passiveTextContent = championPassive.textContent;
	let contentKeys = Object.keys(passiveTextContent);
	let currentTextContent;
	for (let key of contentKeys) {
		currentTextContent = passiveTextContent[key];

		if (currentTextContent.hasOwnProperty('specialScaling')) {
			let scalingKeys = Object.keys(currentTextContent.specialScaling);
			for (let sKey of scalingKeys) {
				let specialScalingData = currentTextContent.specialScaling[sKey];
				let specialSkillTab = {};

				let levelLimiterValues;
				let levelLimiterType;

				let scalings = []; //[[scalingPart, scalingPartType]]

				//get the flatPart
				let flatPart = specialScalingData.botValues.split(';').map((value) => Number(value));
				let flatPartType = specialScalingData.text.slice(specialScalingData.text.indexOf('(') + 1, specialScalingData.text.indexOf(')')).toLowerCase();
				//	flatPartType = scalingPart.text.slice(scalingPart.text.indexOf('('), scalingPart.text.indexOf(')'))
				if (specialScalingData.topLabel != null) {
					let scalingPartType = specialScalingData.topLabel;
					let scalingValues = specialScalingData.topValues;
				}

				specialSkillTab.flatPart = flatPart;
				specialSkillTab.flatPartType = flatPartType;
				specialSkillTab.levelLimiterValues = levelLimiterValues;
				specialSkillTab.levelLimiterType = levelLimiterType;
				specialSkillTab.concerningMeta = championPassive.metaData;
				//test if it empowers a ability
				specialScalingData.empowers = analyseTextForEmpowerments();
				newCurrentTextContent = specialScalingData;

				currentTextContent.specialScaling[scalingKeys[sKey]] = specialSkillTab;
			}
		}
	}
	//TODO: check if the special scaling is already  in the skillTab
	return championData;
}

function analyseTextForEmpowerments(toAnalyseText, abilityNames) {
	/** analyses the text for keywords and sets a connection to the concerning specialScalings-skillTabs
	 *
	 * @param {Object} toAnalyseText the  text to be analysed
	 * @param {Array} abiilityNames the names where to search for in the text for to get the empowerements
	 */
}
