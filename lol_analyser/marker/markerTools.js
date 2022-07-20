import * as markerData from './markerData.js';
import * as tools from '../../tools.js';

export async function showAllMarkerPositions() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
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
							if (testResult)
								console.log(
									'searchPattern\t',
									searchPattern,
									'\tfound in:\t',
									championName,
									'\t',
									abilityData[abKey].name
								);
						});
					}
				}
			}
		} catch (err) {
			tools.reportError('show all markers', championName, err.message, err.stack);
		}
	}
}

export async function markToIgnoreSkillTabMarkers(championAbilitiesData) {
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilitiesData[i];

		let textContentKeys = Object.keys(currentAbility.textContent);

		try {
			for (var tK of textContentKeys) {
				let skillTabKeys = Object.keys(currentAbility.textContent[tK].skillTabs);

				for (var sTK of skillTabKeys) {
					let currentSkillTabMarker =
						currentAbility.textContent[tK].skillTabs[sTK].marker;

					for (var toIgnore of markerData.ignoreMarkerWords) {
						if (currentSkillTabMarker.indexOf(toIgnore) > -1) {
							currentSkillTabMarker = 'IGNORE THIS';
						}
					}
					currentAbility.textContent[tK].skillTabs[sTK].marker = currentSkillTabMarker;
				}
			}
		} catch (err) {
			console.log(err);
			console.log(currentAbility);
		}

		championAbilitiesData[i] = currentAbility;
	}

	return championAbilitiesData;
}

export async function cleanMarkers(skillTabArray) {
	/** all markers to lower case and delete unnecessary words like "champion" */
	let cleaningList = markerData.cleaningList;
	try {
		skillTabArray.forEach((abilityArrays) => {
			if (abilityArrays.length > 0) {
				abilityArrays.forEach((textContent) => {
					textContent.forEach((skillTab) => {
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

	return skillTabArray;
}
