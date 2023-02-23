import * as markerData from './markerData.js';
import * as tools from '../tools/tools.js';

const CHAMPIONSAVEPATH = './data/champions/';
export async function simplifySkillTabs() {
	unifyAbilityMarkers();
	sortOutMaximumSkillTabs();
	splitMixDamageInSkillTabs();
}

export async function unifyAbilityMarkers() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;

		console.log(`simplify abilities: ${inGameName} \t ${championEntry.index}`);
		try {
			let championData = await tools.fileSystem.loadJSONData(`${CHAMPIONSAVEPATH}${inGameName}_data.json`);

			let abilityData = championData.analysed_data.abilities;
			//TODO: this function not only unifies markers but also restructuring the ability data --> should it be like this?
			//--> check abilityData here and at the end at debugging
			let abilityDataKeys = Object.keys(abilityData);
			for (let abilityNumber of abilityDataKeys) {
				let currentAbility = abilityData[abilityNumber];

				for (let [abPartNumber, abilityPart] of currentAbility.textContent.entries()) {
					console.table({
						abilityNumber: Number(abilityNumber),
						partNumber: abPartNumber,
					});
					let summedAbilityPart = await unifyWording(abilityPart);
					abilityData[abilityNumber].textContent[abPartNumber] = summedAbilityPart;
				}

				//TODO: sortOutMaximum() also restructures the ability data
				let summedAbility = await sortOutMaximum(currentAbility);
				summedAbility = await splitMixDamage(summedAbility);
				abilityData[abilityNumber] = summedAbility;
			}
			championData.analysed_data.abilities = abilityData;
			await tools.fileSystem.saveJSONData(championData, `${CHAMPIONSAVEPATH}${inGameName}_data.json`);
		} catch (err) {
			console.log(err.message);
			console.log(err.stack);
			tools.bugfixing.reportError(
				`analyser_abilities.js:  cant simplify abilities`,
				inGameName,
				err.message,
				err.stack
			);
		}
	}
	return;
}

async function unifyWording(abilityPart) {
	/**
	 * seperates the words from each other and checks if they can be replaced by a unified version
	 * (f.e.: enhanced, increased etc. --> maximum)
	 */
	let unknownMarkerTest = true;
	for (let skillTab of abilityPart.skillTabs) {
		unknownMarkerTest = true;

		let toUnifyMarkerData = markerData.skillTabMarkers.toUnifyMarkers;
		let masterWordsKeys = Object.keys(toUnifyMarkerData);
		let currentMarker = skillTab.marker;

		for (let unifyKey of masterWordsKeys) {
			let currentMasterArray = toUnifyMarkerData[unifyKey].markers;
			let currentMasterUnifiedMarker = toUnifyMarkerData[unifyKey].unifiedMarker;

			currentMasterArray.forEach((toExchangeWord) => {
				if (currentMarker.includes(toExchangeWord)) {
					skillTab.marker = currentMarker.replace(toExchangeWord, currentMasterUnifiedMarker);
				}
			});
		}
	}

	return abilityPart;
}

async function wordSeperator(tempSkillTabMarker) {
	tempSkillTabMarker = tempSkillTabMarker.trim();
	wordsArray = tempSkillTabMarker.split(' ');
	return wordsArray;
}

async function sortOutMaximum(abilityData) {
	/** sorts outs the most maximum skillTabs and drops the minor ones, keeps all unique skillTabs
	 1. check for maxima in every separated text part
	 2. check if there is an overall maximum skillTab,
	 2.1 by assuming one part as the overallMaxima, 
	 2.2 then checking for other skillTabs with the same mathTypes
	 2.3 sum the other skillTabs with the same mathTypes

	 @param 	{object}	abilityData 		all data from one ability

	 @return 	{array}		allSkillTabArrays	the filtered abilityData and put into an array
	*/

	let allSkillTabArrays = [];
	let addedFlatParts = [];
	let addedScalingParts = [];

	let maximumSkillTabs = [];
	let notMaximumSkillTabs = [];
	let minorSkillTabs = [];

	// 1. check for maxima in every separated text part
	abilityData.textContent.forEach((currentTextContent) => {
		if (currentTextContent.skillTabs.length > 0) {
			let allCurrentSkillTabs = currentTextContent.skillTabs;

			minorSkillTabs = [];
			maximumSkillTabs = [];
			notMaximumSkillTabs = [];

			//divide skillTabs in maximum and not maximum skillTabs
			allCurrentSkillTabs.forEach((currentSkillTab) => {
				if (currentSkillTab.marker.indexOf('maximum') > -1) maximumSkillTabs.push(currentSkillTab);
				else notMaximumSkillTabs.push(currentSkillTab);
			});

			//search for minor skillTabs to the maximum skillTabs
			maximumSkillTabs.forEach((currentMaxSkillTab) => {
				minorSkillTabs.push(...searchForMinorSkillTabsByMarker(currentMaxSkillTab, notMaximumSkillTabs));
			});

			if (minorSkillTabs.length > 0 && minorSkillTabs == 0) {
				console.warn('maximum SkillTab found but no concerning minor found');
				console.log('gonna try to find similar Tabs by math template');

				maximumSkillTabs.forEach((currentMaxSkillTab) => {
					minorSkillTabs.push(
						...searchForMinorSkillTabsByMathTemplate(currentMaxSkillTab, notMaximumSkillTabs)
					);
				});
				if (minorSkillTabs.length > 0 && minorSkillTabs == 0)
					console.warn('maximum SkillTab found but STILL no concerning minor found');
			}

			//filter original array from minor arrays
			let notMinorSkillTabs = allCurrentSkillTabs.filter((currentSkilltab) => {
				if (minorSkillTabs.includes(currentSkilltab)) return false;
				else return true;
			});
			allSkillTabArrays.push(...notMinorSkillTabs);
		}
	});
	//2. check if there is an overall maximum skillTab
	//checks if one skillTab is the summ of the other skillTabs

	//TODO: ?how to loop threw the arrays to get sure the possible concerning combinations are covered?
	for (let i = 0; i < allSkillTabArrays.length; i++) {
		addedFlatParts = [];
		addedScalingParts = [];
		let overallMaximumPrototype = allSkillTabArrays[i];
		minorSkillTabs = searchForMinorSkillTabsByMathTemplate(overallMaximumPrototype, allSkillTabArrays);

		for (let n = 0; n < allSkillTabArrays.length; n++) {
			if (n != i) {
				//if its the first run through and added*Parts are empty just push the first part, afterwards sum with every new part
				if (addedFlatParts.length == 0) addedFlatParts.push(allSkillTabArrays[n].math.flats);
				else addedFlatParts = sumMathPart(addedFlatParts, allSkillTabArrays[n].math.flats);
				if (addedScalingParts.length == 0) addedScalingParts.push(allSkillTabArrays[n].math.scalings);
				else addedScalingParts = sumMathPart(addedScalingParts, allSkillTabArrays[n].math.scalings);
			}
		}
	}

	//TODO: some abilities have multiple hits which sum up to the maximum damage, test this
	return allSkillTabArrays;
}

function searchForMinorSkillTabsByMarker(maximumSkillTab, otherSkillTabs) {
	/**analyses the marker words count and order to find similar skilltabs to the maximum skillTab */
	let similarSkillTabs = [];
	let rawMaxMarker = maximumSkillTab.marker;
	let boundriesFromMaximum = rawMaxMarker.split('maximum');
	boundriesFromMaximum = boundriesFromMaximum.map((phrase) => phrase.trim());

	//search for similarSkillTabs by searching for the singleWords in the correct order
	//TODO: ?clean markers in extraction?
	for (let notMaxSkillTabNumber = 0; notMaxSkillTabNumber < otherSkillTabs.length; notMaxSkillTabNumber++) {
		let currentNotMaxWordArray = otherSkillTabs[notMaxSkillTabNumber].marker.split(' ');
		let orderTest = false;
		let orderArray = [];

		//check where the words/phrases appears in the maximum SkillTab marker and check if the order is correct
		for (let i = 0; i < boundriesFromMaximum.length; i++) {
			if (currentNotMaxWordArray.includes(boundriesFromMaximum[i])) {
				orderArray.push(currentNotMaxWordArray.indexOf(boundriesFromMaximum[i]));
			}
		}
		orderTest = testCorrectOrder(orderArray);

		//if all words/phrases found and in correct order, we assume its an similar skillTab to the maximum SkillTab
		if (orderArray.length == boundriesFromMaximum.length && orderTest)
			similarSkillTabs.push(otherSkillTabs[notMaxSkillTabNumber]);
	}

	return similarSkillTabs;
}

function searchForMinorSkillTabsByMathTemplate(mainSkillTab, possibleSkillTabs) {
	/**filters all skillTabs by the mathType of the mainSkillTab for possible related other skillTabs
	 * @param {object} 	mainSkillTab					the template to search for in the other skillTabs
	 * @param {array of objects} possibleSkillTabs		array holding all skillTab-objects including the main/template-SkillTab
	 *
	 * @return {array} similarSkillTabs					array with related similar skillTabs
	 */

	let similarSkillTabs = [];
	let lengthTest = true;
	let typeTest = true;
	let similarPartsTest = true;
	let mainFlats = mainSkillTab.math.flats;
	let mainScalings = mainSkillTab.math.scalings;
	//TODO: ?keep the mainSkillTab in the array and just double the possible overallMaxima in the end for the calculation if its an overallMaxima
	// loop threw possible SkillTabs, check for the same length of the numberPart and then check for the same type,
	// if both are always similar add the tested skillTab to the similarSkillTabs array

	for (let i = 0; i < possibleSkillTabs.length; i++) {
		lengthTest = true;
		typeTest = true;
		similarPartsTest = true;

		let currentTestSkillTab = possibleSkillTabs[i];
		let currentFlats = currentTestSkillTab.math.flats;
		let currentScalings = currentTestSkillTab.math.scalings;

		//test the overall lengths first then go depper and test every single mathArray
		if (currentFlats.length != mainFlats.length) lengthTest = false;
		if (currentScalings.length != mainScalings.length) lengthTest = false;

		if (lengthTest) {
			for (let i = 0; i < currentFlats.length; i++) {
				if (!isTheMathPartSimilar(currentFlats[i], mainFlats[i])) similarPartsTest = false;
			}
			for (let i = 0; i < currentScalings.length; i++) {
				if (!isTheMathPartSimilar(currentScalings[i], mainScalings[i])) similarPartsTest = false;
			}
		}

		if (lengthTest && typeTest && similarPartsTest) similarSkillTabs.push(currentTestSkillTab);
	}
	return similarSkillTabs;
}

function sumMathPart(mathPartOne, mathPartTwo) {
	/**iterats threw the different mathArrays from the flats- or scalingParts and checks if they are sumAble,
	 * if they are sumAble sum it otherwise return the firstPart
	 */
	let lengthFirst = mathPartOne.length;
	let lengthSecond = mathPartTwo.length;
	let typeControl = true;
	let originMathPartOne = mathPartOne;

	if (lengthFirst == lengthSecond) {
		for (let i = 0; i < lengthFirst; i++) {
			//check if both arrays of numbers have the same concerning type
			if (mathPartOne[i][1] == mathPartTwo[i][1]) {
				let currentFirstPart = mathPartOne[i][0];
				let currentSecondPart = mathPartTwo[i][0];

				mathPartOne[i][0] = currentFirstPart.map((currentNumber, index) => {
					let sum = currentNumber + currentSecondPart[index];
					return sum;
				});
			} else typeControl = false;
		}
	}

	if (typeControl) return mathPartOne;
	else return originMathPartOne;
}

function isTheMathPartSimilar(mathPartOne, mathPartTwo) {
	/**test two particular small mathParts if they are similar by testing if the length and the type is the same */
	let lengthTest = true;
	let typeTest = true;

	if (mathPartOne[0].length != mathPartTwo[0].length) lengthTest = false;
	if (mathPartOne[1] != mathPartTwo[1]) typeTest = false;

	if (lengthTest && typeTest) return true;
	else return false;
}

function summIntArray(arrayOne, arrayTwo) {
	/**summs up two arrays containing only numbers */
	if (arrayOne.length == arrayTwo.length) {
		for (let i = 0; i < arrayOne.length; i++) {
			arrayOne[i] += arrayTwo[i];
		}
		return arrayOne;
	}
	return arrayOne;
}

function checkForSameScalingType(arrayOne, arrayTwo) {
	/** checks if the two arrays from the skillTabs have the same scalingType */
	if (arrayOne[1] == arrayTwo[1]) return true;
	else return false;
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
		if (textContent.includes('physical'))
			damageTypes.push(['physical damage', textContent.indexOf('physical damage')]);
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
		tools.bugfixing.reportError(
			'\n cant get damageSplit	- no name onlySkillTab',
			textContent,
			err.message,
			err.stack
		);
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
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${inGameName}_data.json`);
		let abilityData = championData.analysed_data.abilities;
		let searchMarkers = markerData.searchMarkers;

		try {
			let abilityKeys = Object.keys(abilityData.skillTabs);
			for (var abKey of abilityKeys) {
				let currentAbility = abilityData.skillTabs[abKey];
				for (var content of currentAbility) {
					for (var skillTab of content) {
						searchMarkers.forEach((searchPattern) => {
							let testResult = searchPattern.test(skillTab.marker);
							if (testResult)
								console.log(
									'searchPattern\t',
									searchPattern,
									'\tfound in:\t',
									inGameName,
									'\t',
									abilityData[abKey].name
								);
						});
					}
				}
			}
		} catch (err) {
			tools.bugfixing.reportError('show all markers', inGameName, err.message, err.stack);
		}
	}
}

export async function categorizeMarkers() {
	let championList = await tools.looping.getChampionList();
	for (let champEntry of championList) {
		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${champEntry.fileSystenName}`);

		let abilities = championData.analysed_data.abilities;
		for (let i = 0; i < 5; i++) {
			if (!abilities[i].length == 0) {
				let currentAbility = abilities[i];

				for (let abilityPart = 0; abilityPart < currentAbility.length; abilityPart++) {
					let currentPart = currentAbility[abilityPart];
					for (let skillTabNumber = 0; skillTabNumber < currentPart.length; skillTabNumber++) {
						let currentSkillTab = currentPart[skillTabNumber];

						//assign the category
						championData.analysed_data.abilities[i][abilityPart][skillTabNumber].majorCategory =
							getMajorCategory(currentSkillTab);
						championData.analysed_data.abilities[i][abilityPart][skillTabNumber].minorCategory =
							getMinorCategory(currentSkillTab);
					}
				}
			}
		}
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${champEntry.fileSystenName}`);
	}

	return;
}
/**major marker */
let damageMarker = [/(damage)/i];
let enhancerMarker = [/(bonus)/i, /(attack speed)/i, /(reduction)/i, /(penetration)/i, /(buff)/i];
let defensiveMarker = [/(heal)/i, /(shield)/i, /(armor)/i, /(regeneration)/i, /(damage reduction)/i];
let utilityMarker = [
	/(movement)/i,
	/(movespeed)/i,
	/(shroud)/i,
	/(invisibility)/i,
	/(cooldown refund)/i,
	/(stealth)/i,
	/(invulnerability)/i,
];
let softCCMarker = [/(silence)/i, /(slow)/i, /(blind)/i];
let hardCCMarker = [
	/(disable)/i,
	/(stun)/i,
	/(root)/i,
	/(knockup)/i,
	/(charm)/i,
	/(fear)/i,
	/(sleep)/i,
	/(knockback)/i,
	/(taunt)/i,
];
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

//TODO: some markers are the same but have multiple wordings --> simplify it later : 'bonus movement speed' & 'movement speed modifier'

let markers_modifier = ['enhanced', 'sweetspot', 'maximum', 'total', 'empowered', 'minimum', 'per'];
let markers_dmg = [
	'physical damage',
	'magic damage',
	'armor reduction',
	'magic penetration',
	'bonus attack speed',
	"of target's  health",
	"of target's  th",
	'of his missing th',
	"of the target's current th",
];
let markers_def = ['heal', 'shield', 'bonus armor'];
let markers_utility = [
	'stun duration',
	'knock up duration',
	'charm duration',
	'root duration',
	'blind duration',
	'bonus movement speed',
	'movement speed modifier',
	'slow',
	'stealth duration',
];
//TODO
let markers_bonusStats = ['reset', 'energy restored', 'mana refund'];
let markers = [];
markers.push(...markers_dmg, ...markers_def, ...markers_utility);
