import * as markerData from './markerData.js';
import * as tools from '../tools.js';

const CHAMPIONSAVEPATH = './data/champions/';
export async function deleteAndCleanMarkers() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		console.log(championName);
		let championData = await tools.loadJSONData(`${CHAMPIONSAVEPATH}${championName}_data.json`);
		/** delete unnecessary Markers, rest of the markers are set to lower case and grouped to ability.skillTabs
		 * and cleaned from unnecessary words like "champion"*/
		let championAbilities = championData.analysed_data.baseData.abilities;
		try {
			championAbilities = await deleteUnnecessaryMarkers(championAbilities);
		} catch (err) {
			console.log('\ncleanAbilities()	- mark&delete skillTabMarkers \t', championName);
			console.log(err);
			tools.reportError('cleanAbilities()	- mark&delete skillTabMarkers', championName, err.message, err.stack);
		}

		try {
			championAbilities = await cleanMarkers(championAbilities);
		} catch (err) {
			console.log(err);
			tools.reportError('analyse - deleteAndCleanMarkers', championName, err.message, err.stack);
		}
		// championAbilities.skillTabs = await markerTools.applyToAllSkillTabs(
		//   championAbilities.skillTabs,
		//   markerTools.numbersToFloat
		// );
		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./lol_analyser/data/champions/${championName}_data.json`);
	}
}

async function deleteUnnecessaryMarkers(championAbilitiesData) {
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

async function cleanMarkers(abilityArray) {
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
