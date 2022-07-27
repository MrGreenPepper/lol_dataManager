import * as markerData from './markerData.js';
import * as tools from '../../tools.js';
import * as analyser from '../analyser.js';
export async function unifyMarkers() {
	await analyser.simplifyAbilities();
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

export async function deleteUnnecessaryMarkers(championAbilitiesData) {
	let toIgnoreMarkers = markerData.ignoreMarkerWords;
	try {
		for (let i = 0; i < 5; i++) {
			let currentAbility = championAbilitiesData[i];

			for (let abilityPart = 0; abilityPart < currentAbility.length; abilityPart++) {
				let currentAbilityPart = currentAbility[abilityPart];

				currentAbilityPart = currentAbilityPart.filter((skillTab) => {
					// test if you can find the marker in the ignores and return true if ... if the loop doesnt break it return false
					for (let toIgnore of toIgnoreMarkers) {
						if (toIgnore.test(skillTab.marker)) return false;
					}
					return true;
				});

				championAbilitiesData[i][abilityPart] = currentAbilityPart;
			}
		}
	} catch (err) {
		console.log(err);
		console.log(currentAbility);
	}
	return championAbilitiesData;
}

export async function cleanMarkers(abilityArray) {
	/** all markers to lower case and delete unnecessary words like "champion" */
	let cleaningList = markerData.cleaningList;
	try {
		abilityArray.forEach((abilityPart) => {
			if (abilityPart.length > 0) {
				abilityPart.forEach((currentAbilityPart) => {
					currentAbilityPart.forEach((skillTab) => {
						let marker = skillTab.marker;
						marker = marker.toLowerCase();

						//first try it with a space at the end
						cleaningList.map((toCleanContent) => {
							toCleanContent = toCleanContent + ' ';
							marker = marker.replace(toCleanContent, '');
							marker = marker.trim();
						});
						cleaningList.map((toCleanContent) => {
							marker = marker.replace(toCleanContent, '');
							marker = marker.trim();
						});
						marker = marker.replace(/:/gi, '');
						marker = marker.trim();
						skillTab.marker = marker;
					});
				});
			}
		});
	} catch (err) {
		console.log(err);
	}

	return abilityArray;
}

/**


async function unifyMarkers(itemDataStats) {
	//TODO: vereinheitlichen von allen unify methods
	itemDataStats = itemDataStats.map((currentStat) => {
		switch (true) {
			case currentStat[1].includes('Lethality'):
				return [currentStat[0], 'lethality'];

			default:
				return currentStat;
		}
	});
	return itemDataStats;
}
*/
