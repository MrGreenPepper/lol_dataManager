import * as markerData from './markerData.js';
import * as tools from '../tools.js';

const CHAMPIONSAVEPATH = './data/champions/';
export async function unifyAbilityMarkers() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;

		console.log(`simplify abilities: ${championName} \t ${championEntry.index}`);
		try {
			let championData = await tools.loadJSONData(`${CHAMPIONSAVEPATH}${championName}_data.json`);

			let abilityData = championData.analysed_data.baseData.abilities;
			for (let [abilityNumber, currentAbility] of abilityData.entries()) {
				for (let [abPartNumber, abilityPart] of currentAbility.entries()) {
					let summedAbilityPart = await unifyWording(abilityPart);
					summedAbilityPart = await sortOutMaximum(abilityPart);
					summedAbilityPart = await splitMixDamage(summedAbilityPart);

					abilityData[abilityNumber][abPartNumber] = summedAbilityPart;
				}
			}
			championData.analysed_data.baseData.abilities = abilityData;
			await tools.saveJSONData(championData, `${CHAMPIONSAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log(err.message);
			console.log(err.stack);
			tools.reportError(`analyser_abilities.js:  cant simplify abilities`, championName, err.message, err.stack);
		}
	}
	return;
}

async function unifyWording(skillTabArray) {
	/**
	 * seperates the words from each other and checks if they can be replaced by a unified version
	 * (f.e.: enhanced, increased etc. --> maximum)
	 */
	for (let [skTabIndex, skillTab] of skillTabArray.entries()) {
		let toUnifyMarkerData = markerData.unifyWording;
		let masterWords = Object.keys(toUnifyMarkerData);
		let currentMarker = skillTab.marker;

		for (let i = 0; i < masterWords.length; i++) {
			let currentMasterWord = masterWords[i];
			let currentMasterArray = toUnifyMarkerData[currentMasterWord];

			currentMasterArray.forEach((toExchangeWord) => {
				if (currentMarker.indexOf(toExchangeWord) > -1) {
					skillTabArray[skTabIndex].marker = currentMarker.replace(toExchangeWord, currentMasterWord);
				}
			});
		}
	}

	return skillTabArray;
}

async function wordSeperator(tempSkillTabMarker) {
	tempSkillTabMarker = tempSkillTabMarker.trim();
	wordsArray = tempSkillTabMarker.split(' ');
	return wordsArray;
}

async function sortOutMaximum(skillTabArray) {
	let maximumSkillTabs = skillTabArray.filter((currentSkillTab) => {
		if (currentSkillTab.marker.indexOf('maximum') > -1) return true;
		else return false;
	});

	let notMaximumSkillTabs = skillTabArray.filter((currentSkillTab) => {
		if (maximumSkillTabs.includes(currentSkillTab)) return false;
		else return true;
	});
	let similarSkillTabs = [];
	maximumSkillTabs.forEach((currentMaxSkillTab) => {
		let rawMaxMarker = currentMaxSkillTab.marker;
		let boundries = rawMaxMarker.split('maximum');
		boundries = boundries.map((phrase) => phrase.trim());

		//search for similarSkillTabs by searching for the singleWords in the correct order

		for (let notMaxSkillTabNumber = 0; notMaxSkillTabNumber < notMaximumSkillTabs.length; notMaxSkillTabNumber++) {
			let notMaxWordArray = notMaximumSkillTabs[notMaxSkillTabNumber].marker.split(' ');

			let tester = false;

			let testerArray = [];
			for (let i = 0; i < boundries.length; i++) {
				if (notMaxWordArray.includes(boundries[i])) {
					testerArray.push(notMaxWordArray.indexOf(boundries[i]));
				}
			}
			if (testerArray.length == boundries.length && testCorrectOrder(testerArray)) similarSkillTabs.push(notMaximumSkillTabs[notMaxSkillTabNumber]);
		}
	});

	//filter original array from similar arrays
	skillTabArray = skillTabArray.filter((currentSkilltab) => {
		if (similarSkillTabs.includes(currentSkilltab)) return false;
		else return true;
	});
	return skillTabArray;
}

function testCorrectOrder(numberArray) {
	let tester = true;
	for (let i = 0; i < numberArray - 1; i++) {
		if (numberArray[i] > numberArray[i + 1]) false;
	}
	return tester;
}
async function splitMixDamage(originSkillTabArray) {
	/**splits all mixed damage skillTabs into 2 separated skillTabs*/

	//first filter the mixed skillTabs

	let mixedSkillTabs = originSkillTabArray.filter((currentSkillTab) => {
		return /mixed/i.test(currentSkillTab.marker);
	});
	//filter the original array
	let noneMixedTabs = originSkillTabArray.filter((currentSkillTab) => {
		return !/mixed/i.test(currentSkillTab.marker);
	});

	//split the mixed arrays
	let damageSplitArray = [];
	for (let i = 0; i < mixedSkillTabs.length; i++) {
		let currentSkillTab = mixedSkillTabs[i];

		try {
			damageSplitArray.push(...(await extractDamageSplit(currentSkillTab)));
		} catch {
			damageSplitArray.push(await extractDamageSplit(currentSkillTab));
		}
	}
	//workaround if the extractDamageSplit returns the original singleArray
	if (0 < damageSplitArray.length) {
		noneMixedTabs.push(...damageSplitArray);
	}

	return noneMixedTabs;
}
async function extractDamageSplit(skillTab) {
	try {
		let textContent = skillTab.concerningText;
		let damageSplit = {};
		damageSplit.type = 'equal';
		//TODO: search the textContent for division words (like equal or %)
		if (/equal/gi.test(textContent)) {
			damageSplit.split1 = 50;
			damageSplit.split2 = 50;
		}
		if (/(%).*(%)/gi.test(textContent)) {
			damageSplit.type = 'percent';
			console.log('PERCENT DAMAGE SPLIT: \n\n', textContent);
		}
		//search the textContent for damage type words(like physical, ...)
		let damageTypes = [];
		if (textContent.includes('magic')) damageTypes.push(['magic damage', textContent.indexOf('magic damage')]);
		if (textContent.includes('physical')) damageTypes.push(['physical damage', textContent.indexOf('physical damage')]);
		if (textContent.includes('true')) damageTypes.push(['true damage', textContent.indexOf('true damage')]);
		//sort the damageTypes by there appearance ... % split is given in the same order
		damageTypes = damageTypes.sort((a, b) => {
			return a[1] - b[1];
		});

		let firstSplit = generateSplitSkillTab(skillTab, damageSplit.split1, damageTypes[0][0]);
		let secondeSplit = generateSplitSkillTab(skillTab, damageSplit.split2, damageTypes[1][0]);

		return [firstSplit, secondeSplit];
	} catch (err) {
		console.log('\n', err);
		tools.reportError('\n cant get damageSplit	- no name onlySkillTab', textContent, err.message, err.stack);
		return skillTab;
	}
}

function generateSplitSkillTab(originSkillTab, percentage, newTyp) {
	let newSkillTab = JSON.parse(JSON.stringify(originSkillTab));

	newSkillTab.marker = newSkillTab.marker.replace('mixed damage', newTyp);
	newSkillTab.math.flatPart = newSkillTab.math.flats.map((currentFlatPart) => {
		currentFlatPart[0] = currentFlatPart[0].map((element) => element / 2);
		return currentFlatPart;
	});
	let scalingParts = newSkillTab.math.scalings;
	for (let i = 0; i < scalingParts.length; i++) {
		let currentScalingPart = scalingParts[i];
		currentScalingPart[0] = currentScalingPart[0].map((element) => element / 2);
	}

	return newSkillTab;
}
export async function showAllMarkerPositions() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		let abilityData = championData.analysed_data.baseData.abilities;
		let searchMarkers = markerData.searchMarkers;

		try {
			let abilityKeys = Object.keys(abilityData.skillTabs);
			for (var abKey of abilityKeys) {
				let currentAbility = abilityData.skillTabs[abKey];
				for (var content of currentAbility) {
					for (var skillTab of content) {
						searchMarkers.forEach((searchPattern) => {
							let testResult = searchPattern.test(skillTab.marker);
							if (testResult) console.log('searchPattern\t', searchPattern, '\tfound in:\t', championName, '\t', abilityData[abKey].name);
						});
					}
				}
			}
		} catch (err) {
			tools.reportError('show all markers', championName, err.message, err.stack);
		}
	}
}

export async function categorizeMarkers() {
	let championList = await tools.getChampionList();
	for (let champEntry of championList) {
		let championData = await tools.loadJSONData(`./data/champions/${champEntry.championSaveName}_data.json`);

		let abilities = championData.analysed_data.baseData.abilities;
		for (let i = 0; i < 5; i++) {
			if (!abilities[i].length == 0) {
				let currentAbility = abilities[i];

				for (let abilityPart = 0; abilityPart < currentAbility.length; abilityPart++) {
					let currentPart = currentAbility[abilityPart];
					for (let skillTabNumber = 0; skillTabNumber < currentPart.length; skillTabNumber++) {
						let currentSkillTab = currentPart[skillTabNumber];

						//assign the category
						championData.analysed_data.baseData.abilities[i][abilityPart][skillTabNumber].majorCategory = getMajorCategory(currentSkillTab);
						championData.analysed_data.baseData.abilities[i][abilityPart][skillTabNumber].minorCategory = getMinorCategory(currentSkillTab);
					}
				}
			}
		}
		await tools.saveJSONData(championData, `./data/champions/${champEntry.championSaveName}_data.json`);
	}

	return;
}
/**major marker */
let damageMarker = [/(damage)/i];
let enhancerMarker = [/(bonus)/i, /(attack speed)/i, /(reduction)/i, /(penetration)/i, /(buff)/i];
let defensiveMarker = [/(heal)/i, /(shield)/i, /(armor)/i, /(regeneration)/i, /(damage reduction)/i];
let utilityMarker = [/(movement)/i, /(movespeed)/i, /(shroud)/i, /(invisibility)/i, /(cooldown refund)/i, /(stealth)/i, /(invulnerability)/i];
let softCCMarker = [/(silence)/i, /(slow)/i, /(blind)/i];
let hardCCMarker = [/(disable)/i, /(stun)/i, /(root)/i, /(knockup)/i, /(charm)/i, /(fear)/i, /(sleep)/i, /(knockback)/i, /(taunt)/i];
/**minor marker */
function getMajorCategory(skillTab) {
	//TODO: analyse 'duration'-marker with the complete abilityPart to connect it with an other marker
	let marker = skillTab.marker;
	for (let i = 0; i < defensiveMarker.length; i++) {
		let currentRegex = defensiveMarker[i];
		if (currentRegex.test(marker)) return 'defensive';
	}

	for (let i = 0; i < damageMarker.length; i++) {
		let currentRegex = damageMarker[i];
		if (currentRegex.test(marker)) {
			return 'damage';
		}
	}

	//bonus damage wouldnt count since damager marker are sort out above
	for (let i = 0; i < enhancerMarker.length; i++) {
		let currentRegex = enhancerMarker[i];
		if (currentRegex.test(marker)) return 'enhancer';
	}

	for (let i = 0; i < utilityMarker.length; i++) {
		let currentRegex = utilityMarker[i];
		if (currentRegex.test(marker)) return 'utility';
	}

	for (let i = 0; i < softCCMarker.length; i++) {
		let currentRegex = softCCMarker[i];
		if (currentRegex.test(marker)) return 'softCC';
	}

	for (let i = 0; i < hardCCMarker.length; i++) {
		let currentRegex = hardCCMarker[i];
		if (currentRegex.test(marker)) return 'hardCC';
	}

	console.log('analyseMarker(): unknown marker:', marker);
	return 'unknown';
}

function getMinorCategory(skillTab) {
	let majorCategory = skillTab.majorCategory;
	let marker = skillTab.marker;
	if (majorCategory == 'damage') {
		let major = 'damage';
		if (/(magic)/i.test(marker)) return major + ' magic';
		if (/(true)/i.test(marker)) return major + ' true';
		if (/(physical)/i.test(marker)) return major + ' ad';
		else return major + ' ad';
	}
	if (majorCategory == 'softCC') {
		let minorCategories = softCCMarker;
		for (let i = 0; i < minorCategories.length; i++) {
			if (minorCategories[i].test(marker)) {
				let regexString = regexToString(minorCategories[i]);
				return regexString;
			}
		}
	}

	if (majorCategory == 'hardCC') {
		let minorCategories = hardCCMarker;
		for (let i = 0; i < minorCategories.length; i++) {
			if (minorCategories[i].test(marker)) {
				let regexString = regexToString(minorCategories[i]);
				return regexString;
			}
		}
	}

	console.log('analyseMarker(): unknown minor category:', marker);
	return 'unknown';
}

function regexToString(regex) {
	let regexString = regex.toString();
	regexString = regexString.slice(0, regexString.length - 1);
	regexString = regexString.replaceAll('/', '');
	regexString = regexString.replaceAll('(', '');
	regexString = regexString.replaceAll(')', '');

	return regexString;
}
