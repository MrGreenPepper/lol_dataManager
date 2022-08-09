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

			abilities = applyToAllAbilityParts(abilities, sortMarkedPassages);
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

function sortMarkedPassages(abilityPart) {
	/** the marked passages are from a queryselector for 'span' and 'a' sometimes a span included another span,
	 * thus we can delete the unnecessary part,
	 * in this concern we always delete the smaller parts cause we want to keep the information which parts concern together
	 */
	let markedPassages = abilityPart.markedPassages;
	let sortedArray = [];

	//sort out icons

	markedPassages = markedPassages.filter((element) => {
		if (element[1] != '') return true;
		else return false;
	});
	//chech if the text part is already in inFront or behind, if so take the biggest one and drop the others
	for (let i = 0; i < markedPassages.length; i++) {
		let alreadyIncluded = false;
		let currentText = markedPassages[i][1];
		let pastText;
		let futureText;
		if (i == 0) pastText = '';
		else pastText = markedPassages[i - 1][1];
		if (i == markedPassages.length - 1) futureText = '';
		else futureText = markedPassages[i + 1][1];

		currentText = currentText.trim();
		pastText = pastText.trim();
		futureText = futureText.trim();
		// one of this length comparisons needs to be <= cause when the length is  equal i still just want to keep one
		// the length comparison is unnecessary cause if it shorter i cant include the longer one but keep it for better reading
		if (pastText.includes(currentText) && currentText.length < pastText.length) {
			alreadyIncluded = true;
		}
		if (futureText.includes(currentText) && currentText.length <= futureText.length) {
			alreadyIncluded = true;
		}
		//for now i drop the html part cause all html keeping data is already classified as specialScaling;
		if (!alreadyIncluded) sortedArray.push(markedPassages[i][1]);
	}

	//get the position of the marked passages in the text
	sortedArray = sortedArray.map((textPassages) => {
		textPassages = textPassages.trim();
		let startPosition = abilityPart.text.indexOf(textPassages);
		let endPosition = startPosition + textPassages.length;
		return [textPassages, startPosition, endPosition];
	});
	abilityPart.markedPassages = sortedArray;
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
