import * as markerData from './markerData.js';
import * as tools from '../tools/tools.js';

const CHAMPIONSAVEPATH = './data/champions/';
export async function deleteAndCleanMarkers() {
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		let inGameName = championEntry.fileSystenName;
		console.log(inGameName);
		let championData = await tools.fileSystem.loadJSONData(`${CHAMPIONSAVEPATH}${inGameName}_data.json`);
		/** delete unnecessary Markers, rest of the markers are set to lower case and grouped to ability.skillTabs
		 * and cleaned from unnecessary words like "champion"*/
		let championAbilities = championData.analysed_data.abilities;
		try {
			championAbilities = await deleteUnnecessaryMarkers(championAbilities);
		} catch (err) {
			console.log('\ncleanAbilities()	- mark&delete skillTabMarkers \t', inGameName);
			console.log(err);
			tools.bugfixing.reportError(
				'cleanAbilities()	- mark&delete skillTabMarkers',
				inGameName,
				err.message,
				err.stack
			);
		}

		try {
			championAbilities = await cleanMarkers(championAbilities);
		} catch (err) {
			console.log(err);
			tools.bugfixing.reportError('analyse - deleteAndCleanMarkers', inGameName, err.message, err.stack);
		}
		// championAbilities.skillTabs = await markerTools.applyToAllSkillTabs(
		//   championAbilities.skillTabs,
		//   markerTools.numbersToFloat
		// );
		await tools.fileSystem.saveJSONData(championData, `./data/champions/${inGameName}_data.json`);
		await tools.fileSystem.saveJSONData(championData, `./lol_analyser/data/champions/${inGameName}_data.json`);
	}
}
export async function cleanEmptyTextContent(currentAbility) {
	let textContentKeys = Object.keys(currentAbility.textContent);

	for (let tK of textContentKeys) {
		let keys = Object.keys(currentAbility.textContent[tK]);
		if (keys.length == 0) {
			delete currentAbility.textContent[tK];
		}
	}

	return currentAbility;
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
