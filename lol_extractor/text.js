import * as tools from '../tools/tools.js';
import { extraSkillTabsFromText } from './text/extraSkillTabsFromText.js';
const LOGSAVEPATH = './lol_extractor/data/champions/';
const DATASAVEPATH = './data/champions/';
/**extracts calculation relevant data from text. Like extra skillTabs, empowerements etc. */
export async function exText() {
	let championList = await tools.looping.getChampionList();

	for (let championEntry of championList) {
		let inGameName = championEntry.inGameName;
		//	console.log('\x1b[31m', championEntry.inGameName, '\x1b[0m');
		console.log(championEntry.inGameName, '\t', championEntry.index);
		try {
			//first load the data
			let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);

			/** TASKS */
			let abilities = championData.extracted_data.abilities;
			let abilityNames = championData.extracted_data.baseData.abilityNames;

			abilities = applyToAllAbilityParts(abilities, filterMarkedPassagas);
			abilities = applyToAllAbilityParts(abilities, markPassiveAndInnate);
			abilities = applyToAllAbilityParts(abilities, extractText);
			//TODO: move to analysis
			abilities = handlePossibleConcerningAbilities(abilities, abilityNames);

			championData = await extraSkillTabsFromText(championData);
			await tools.fileSystem.saveJSONData(championData, `${LOGSAVEPATH}${inGameName}_skillTabs.json`);
			await tools.fileSystem.saveJSONData(championData, `${DATASAVEPATH}${championEntry.fileSystemName}`);
		} catch (err) {
			console.log(err);
			console.log('skilltab extraction failed at champion: ', inGameName);
		}
	}
}

function handlePossibleConcerningAbilities(abilities, abilityNames) {
	let abilityRegex = tools.unifyWording.toBasicRegex(abilityNames);

	for (let abilityNumber = 0; abilityNumber < 5; abilityNumber++) {
		let textContentKeys = Object.keys(abilities[abilityNumber].textContent);
		for (let contentKey of textContentKeys) {
			let currentTextContent = abilities[abilityNumber].textContent[contentKey];
			currentTextContent.concerningSkills = [];
			//decide if its an basic ability or a new championState
			for (let skNumber = 0; skNumber < currentTextContent.possibleConcerningAbilities.length; skNumber++) {
				let possibleSkillName = tools.unifyWording.basicStringClean(
					currentTextContent.possibleConcerningAbilities[skNumber]
				);
				let concerningSkill = {};
				concerningSkill.skillName = possibleSkillName;

				// test if there is a concerning baseAbility
				let foundMatchingAbility = false;
				abilityRegex.forEach((currentAbName, index) => {
					if (!foundMatchingAbility) {
						let nameTest = currentAbName.test(possibleSkillName);
						let sameAbilityTest = abilityNumber == index;
						if (nameTest && !sameAbilityTest) {
							foundMatchingAbility = true;
							concerningSkill.concerningAbility = index;
							concerningSkill.selfAbilityConcern = false;
						}
						if (nameTest && sameAbilityTest) {
							foundMatchingAbility = true;
							concerningSkill.concerningAbility = index;
							concerningSkill.selfAbilityConcern = true;
						}
					}
				});
				//if nothing matching found interpret it as uniqui champiion condition
				if (!foundMatchingAbility) {
					concerningSkill.skillType = 'unique extra character condition';
				}

				abilities[abilityNumber].textContent[contentKey].concerningSkills.push(
					structuredClone(concerningSkill)
				);
			}
		}
		//	delete currentTextContent.possibleConcerningAbilities;
	}
	return abilities;
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

function filterMarkedPassagas(abilityPart) {
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

	//get position and cleanup text a bit
	markedPassages = markedPassages.map((textPassages) => {
		textPassages = textPassages[1].trim();
		let startPosition = abilityPart.text.indexOf(textPassages);
		let endPosition = startPosition + textPassages.length;
		return [textPassages, startPosition, endPosition];
	});

	//check by the position if the text part is already included
	for (let i = 0; i < markedPassages.length; i++) {
		let included = false;
		for (let n = 0; n < markedPassages.length; n++) {
			let positionCheck =
				markedPassages[n][1] <= markedPassages[i][1] && markedPassages[i][2] <= markedPassages[n][2];
			// to prevent doubles filter each other and are completly deleted, not both borders can be the same
			let doubleCheck =
				markedPassages[n][1] == markedPassages[i][1] && markedPassages[i][2] == markedPassages[n][2];
			if (positionCheck && !doubleCheck && i != n) included = true;
		}
		if (!included) sortedArray.push(markedPassages[i]);
	}
	//now sortout doubles
	markedPassages = sortedArray;
	sortedArray = [];
	for (let i = 0; i < markedPassages.length; i++) {
		let included = false;
		for (let n = i + 1; n < markedPassages.length; n++) {
			let doubleCheck =
				markedPassages[n][1] == markedPassages[i][1] && markedPassages[i][2] == markedPassages[n][2];
			if (doubleCheck) included = true;
		}
		if (!included) sortedArray.push(markedPassages[i]);
	}

	/*old version
	//check if the text part is already in inFront or behind, if so take the biggest one and drop the others
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
		// the length comparison is unnecessary cause if it shorter it cant include the longer one but keep it for better reading
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
	});*/
	abilityPart.markedPassages = sortedArray;
	return abilityPart;
}
function textToSkillTab(abilityPart) {
	let onHitRegex;
	let baseOnLevelRegex;
	return abilityPart;
}

function applyToAllAbilityParts(abilities, applyFunction) {
	/**
	 * loops threw the textContents of the abilities and calls the given applyFunction with every single textContent as parameter
	 * @param {object} abilities - the abilities from a champion
	 * @param {function} applyFunction - the function which should be applied to every textContent
	 *
	 * @returns {object} abilities - the abilities after the applied function
	 */
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
