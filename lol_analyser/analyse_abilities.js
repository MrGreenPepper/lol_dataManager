import * as markerTools from './unifyMarkers.js';
import * as tools from '../tools/tools.js';
import * as abilityTools from './abilityTools.js';

const CHAMPIONSAVEPATH = './data/champions/';

async function simplifyMetaData(metaData) {
	let cmetaData = await abilityTools.copyObjectByValue(metaData);
	let metaDataKeys = Object.keys(cmetaData);
	let simpleMetaData = {};
	metaDataKeys.forEach((key) => {
		metaData[key].marker = cmetaData[key].marker.toLowerCase();
		if (metaData[key].marker.indexOf('cooldown') > -1) {
			simpleMetaData.cd = {};
			simpleMetaData.cd.marker = cmetaData[key].marker;
			simpleMetaData.cd.time = cmetaData[key].math.flatPart;
			simpleMetaData.cd.cdType = cmetaData[key].math.flatPartType;
		}
		if (metaData[key].marker.indexOf('cast time') > -1) {
			simpleMetaData.castTime = {};
			simpleMetaData.castTime.marker = cmetaData[key].marker;
			simpleMetaData.castTime.time = cmetaData[key].math.flatPart;
		}
	});

	return { ...simpleMetaData };
}

async function summariesSkillTabs(skillTabArray) {
	/** 	check for final/maximum words and if there is a final word summeries the skillTabs
	 * 	check for utility and sumaries them*/
	skillTabArray = await sortOutMaximum(skillTabArray);
	skillTabArray = await splitMixDamage(skillTabArray);
	skillTabArray = await summariesUtility(skillTabArray);

	return skillTabArray;
}
async function splitMixDamage(skillTabArray) {
	/**splits all mixed damage skillTabs into 2 separated skillTabs*/
	//first filter the mixed skillTabs
	let mixedSkillTabs = [];
	for (let s = 0; s < skillTabArray.length; s++)
		mixedSkillTabs.push(
			...skillTabArray[s].filter((currentSkillTab) => {
				return /mixed/i.test(currentSkillTab.marker);
			})
		);

	skillTabArray = skillTabArray.filter((currentSkillTab) => {
		return !/mixed/i.test(currentSkillTab.marker);
	});
	for (let i = 0; i < mixedSkillTabs.length; i++) {
		let currentSkillTab = mixedSkillTabs[i];

		let firstSplit = [];
		let secondSplit = [];
		let damageSplit = await extractDamageSplit(currentSkillTab.concerningText);
	}
	skillTabArray.push(...mixedSkillTabs);
	return skillTabArray;
}

async function extractDamageSplit(textContent) {
	let damageSplit = {};
	//search the textContent for division words (like equal or %)
	if (/equal/gi.test(textContent)) {
		damageSplit.split1 = 50;
		damageSplit.split1 = 50;
	}
	// if (/(%).?*(%)/gi.test(textContent)) {
	//   damageSplit.type = percent;
	// }
	//search the textContent for damage type words(like physical, ...)
	let damageTypes = [];
	if (textContent.includes('magic damage')) damageTypes.push(['magic', textContent.indexOf('magic damage')]);
	if (textContent.includes('physical damage')) damageTypes.push(['physical', textContent.indexOf('physical damage')]);
	if (textContent.includes('true damage')) damageTypes.push(['true', textContent.indexOf('true damage')]);
	//sort the damageTypes by there appearance ... % split is given in the same order
	damageTypes = damageTypes.sort((a, b) => {
		return a[1] - b[1];
	});

	return damageSplit;
}

async function sortOutMaximum(skillTabArray) {
	skillTabArray = await replaceMarkers(skillTabArray, 'single maximum', 'maximum');
	//first sortOut maximum for every SINGLE SkillTabContent and check if there is a similar marker
	for (let i = 0; i < skillTabArray.length; i++) {
		let maximumSkillTabs = skillTabArray[i].filter((currentSkillTab) => {
			if (/maximum/gi.test(currentSkillTab.marker)) return true;
			else return false;
		});
		//TODO: maybe we need a better similar marker check here
		for (let m = 0; m < maximumSkillTabs.length; m++) {
			let maxMarker = maximumSkillTabs[m].marker;
			maxMarker = maxMarker.replace(/maximum/gi, '');
			maxMarker = maxMarker.trim();
			skillTabArray[i] = skillTabArray[i].filter((currentSkillTab) => {
				if (currentSkillTab.marker.includes(maxMarker)) return false;
				else return true;
			});
		}

		skillTabArray[i].push(...maximumSkillTabs);
	}

	//second check if there is an overallMaximum
	// 1. check if there are maxMarkers
	let maximumSkillTabs = [];
	for (let i = 0; i < skillTabArray.length; i++) {
		maximumSkillTabs.push(
			...skillTabArray[i].filter((currentSkillTab) => {
				if (/maximum/gi.test(currentSkillTab.marker)) return true;
				else return false;
			})
		);
	}

	//filter for unique markers
	let maxMarkers = [];
	for (let i = 0; i < maximumSkillTabs.length; i++) {
		let currentMarker = maximumSkillTabs[i].marker;
		if (!maxMarkers.includes(currentMarker)) maxMarkers.push(currentMarker);
	}
	//for each maxMarker sort out all similar SkillTabs to theCurrent maxMarkers
	for (let m = 0; m < maxMarkers.length; m++) {
		let similarSkillTabs = [];
		let currentMaxMarker = maxMarkers[m];
		for (let i = 0; i < skillTabArray.length; i++) {
			similarSkillTabs.push(
				...skillTabArray[i].filter((currentSkillTab) => {
					if (currentSkillTab.marker.includes(currentMaxMarker)) return true;
					else return false;
				})
			);
		}
		// delete all similarSkillTabs from the origin Array
		for (let s = 0; s < skillTabArray.length; s++) {
			skillTabArray[s] = skillTabArray[s].filter((currentTab) => {
				if (similarSkillTabs.includes(currentTab)) return false;
				else return true;
			});
		}
		//check if the last maxMarker is a combination of the first ones
		//TODO: maybe a more complex combination check for overall maximum is needed
		let flatSum = similarSkillTabs.reduce((acc, currentSkillTab) => {
			return acc + currentSkillTab.math.flatPart[0];
		}, 0);
		//check if the last skillTab is an combination of the first ones,
		//if push only the last skillTab, otherwise push all back to the origin skillTab
		if (flatSum / 2 == similarSkillTabs[similarSkillTabs.length - 1].math.flatPart[0])
			skillTabArray.push([similarSkillTabs[similarSkillTabs.length - 1]]);
		else skillTabArray.push([...similarSkillTabs]);
	}

	// delete empty SkillTabContents
	let tempArray = [];
	for (let t = 0; t < skillTabArray.length; t++) {
		if (skillTabArray[t].length > 0) tempArray.push(skillTabArray[t]);
	}
	skillTabArray = tempArray;
	if (skillTabArray.length > 0) skillTabArray = await replaceMarkers(skillTabArray, 'maximum', '');
	return skillTabArray;
}

async function replaceMarkers(allSkillTabs, originalMarker, replaceMarker) {
	for (let i = 0; i < allSkillTabs.length; i++) {
		let skillTabArray = allSkillTabs[i];
		let finalArray = skillTabArray.filter((skillTab) => {
			return skillTab.marker.indexOf(originalMarker) > -1;
		});

		finalArray.forEach((skillTab) => {
			skillTab.marker = skillTab.marker.trim();
			skillTab.marker = skillTab.marker.replace(originalMarker, replaceMarker);
			skillTab.marker = skillTab.marker.trim();

			skillTabArray = skillTabArray.filter((originalSkillTab) => {
				return originalSkillTab.marker.indexOf(skillTab.marker) == -1;
			});
		});

		skillTabArray = skillTabArray.concat(finalArray);
		allSkillTabs[i] = skillTabArray;
	}

	return allSkillTabs;
}

async function summariesUtility(skillTabArray) {
	//TODO: summarize utility
	for (let i = 0; i < skillTabArray.length; i++) {}
	return skillTabArray;
}
