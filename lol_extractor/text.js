import * as tools from '../tools.js';
const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';
export async function exText() {
	let championList = await tools.getChampionList();

	for (let champEntry of championList) {
		let championName = champEntry.championSaveName;
		//	console.log('\x1b[31m', champEntry.championName, '\x1b[0m');
		console.log(champEntry.championName, '\t', champEntry.index);
		try {
			//first load the data
			let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);

			/** TASKS */
			let abilities = championData.extracted_data.baseData.abilities;
			abilities = applyToAllAbilityParts(abilities, markPassiveAndInnate);
			abilities = applyToAllAbilityParts(abilities, textToSkillTab);
			abilities = applyToAllAbilityParts(abilities, extractText);

			await tools.saveJSONData(championData, `${LOGSAVEPATH}${championName}_skillTabs.json`);
			await tools.saveJSONData(championData, `${DATASAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', championName);
		}
	}
}

function markPassiveAndInnate(abilityPart) {
	let regexInnate = /(class=\"template_sbc\"><b>Innate:)/i;
	let regexPassive = /(class=\"template_sbc\"><b>Passive:)/i;
	if (regexInnate.test(abilityPart.html)) {
		abilityPart.innate = true;
	} else {
		abilityPart.innate = false;
	}
	if (regexPassive.test(abilityPart.html)) {
		abilityPart.passive = true;
	} else {
		abilityPart.passive = false;
	}
	return abilityPart;
}

function extractText(abilityPart) {
	return abilityPart;
}

function textToSkillTab(abilityPart) {
	let onHitRegex;
	let baseOnLevelRegex;
	return abilityPart;
}

function applyToAllAbilityParts(abilities, applyFunction) {
	for (let i = 0; i < 5; i++) {
		let currentAbility = abilities[i].textContent;
		let currentAbilityParts = Object.keys(currentAbility);
		for (let abilityPart = 0; abilityPart < currentAbilityParts.length; abilityPart++) {
			let partKey = currentAbilityParts[abilityPart];
			currentAbility[partKey] = applyFunction(currentAbility[partKey]);
		}
	}
	return abilities;
}
