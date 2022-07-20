import * as markerData from './markerData.js';

export default async function applyToAllSkillTabs(skillTabs, applyFunction) {
	/** applies a function to every single skillTab
	 *
	 * @param {object} skillTabs - kind of array out of skillTabs in form of an object
	 * @param {function} applyFunction - function which is applied to every single skillTab
	 *
	 * @returns {object} skillTabs - modified skillTabsArray
	 */
	let abilityKeys = Object.keys(skillTabs);
	try {
		for (var i of abilityKeys) {
			let currentAbility = skillTabs[i];
			for (let n = 0; n < currentAbility.length; n++) {
				let currentContent = currentAbility[n];
				for (let c = 0; c < currentContent.length; c++) {
					skillTabs[i][n][c] = await applyFunction(currentContent[c]);
				}
			}
		}
	} catch (err) {
		console.log(err);
		console.log(skillTabs);
	}

	return skillTabs;
}

export async function allStringsToMath(championAbilities) {
	for (let i = 0; i < championAbilities.skillTabs.length; i++) {
		let currentAbility = championAbilities.skillTabs[i];
		for (let textCNumber = 0; textCNumber < currentAbility.length; textCNumber++) {
			let currentTextContent = currentAbility[textCNumber];
		}
	}
}

export async function cleanEmptyTextContent(currentAbility) {
	let textContentKeys = Object.keys(currentAbility.textContent);

	for (tK of textContentKeys) {
		let keys = Object.keys(currentAbility.textContent[tK]);
		if (keys.length == 0) {
			delete currentAbility.textContent[tK];
		}
	}

	return currentAbility;
}
export async function createSkillTabArray(championAbilities) {
	/**reads out all NOT-EMPTY skillTabs, assigns the concerning text and metaData to it */

	let skillTabArray = [];
	championAbilities.skillTabs = {};
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];
		currentAbility = await cleanEmptyTextContent(currentAbility);

		skillTabArray.push(await allSkillTabsToArray(currentAbility));
	}
	return skillTabArray;
}

export async function getAllSkillTabMarkers() {
	let allSkillTabMarkers = [];
	let toUnifyKeys = Object.keys(markerData.skillTabMarkers.toUnifyMarkers);
	let objValues = Object.values(markerData.skillTabMarkers);

	for (uKey of toUnifyKeys) {
		//console.log(uKey);
		allSkillTabMarkers.push(
			...Object.values(markerData.skillTabMarkers.toUnifyMarkers[uKey].markers)
		);
		allSkillTabMarkers.push(markerData.skillTabMarkers.toUnifyMarkers[uKey].unifiedMarker);
	}

	allSkillTabMarkers.push(...Object.values(markerData.skillTabMarkers.unusedSkillTabMarkers));
	allSkillTabMarkers.push(...Object.values(markerData.skillTabMarkers.specialAttentionneeded));
	allSkillTabMarkers.push(...Object.values(markerData.skillTabMarkers.scalingMarkers));
	allSkillTabMarkers.push(...Object.values(markerData.skillTabMarkers.combinationMarkers));

	return allSkillTabMarkers;
}

export async function getMarkerPositions(currentAbility, requestedMarker) {
	return new Promise((resolve, reject) => {
		let markerPosition;

		let textContentKeys = Object.keys(currentAbility.textContent);
		try {
			for (tK of textContentKeys) {
				let skillTabKeys = Object.keys(currentAbility.textContent[tK].skillTab);

				for (sTK of skillTabKeys) {
					let subSkillTabKeys = Object.keys(currentAbility.textContent[tK].skillTab[sTK]);

					for (sSTK of subSkillTabKeys) {
						if (
							currentAbility.textContent[tK].skillTab[sTK][
								sSTK
							].marker.hasOwnProperty(requestedMarker)
						) {
							markerPosition = toString(
								currentAbility.textContent[tK].skillTab[sTK][sSTK]
							);
							return resolve([true, markerPosition]);
						}
					}
				}
			}
		} catch (err) {
			console.log(err);
			console.log(currentAbility);
		}
		return reject(false);
	});
}

export async function showAllMarkerPositions(abilityData) {
	let searchMarkers = markerData.searchMarkers;
	let abilityKeys = Object.keys(abilityData.skillTabs);
	for (var abKey of abilityKeys) {
		let currentAbility = abilityData.skillTabs[abKey];
		for (var content of currentAbility) {
			for (var skillTab of content) {
				searchMarkers.forEach((searchPattern) => {
					let testResult = searchPattern.test(skillTab.marker);
					if (testResult)
						console.log(
							'searchPattern',
							searchPattern,
							' found in: ',
							abilityData[abKey].name
						);
				});
			}
		}
	}
}
export async function numbersToFloat(skillTab) {
	/** transforms all numbers in strings to actual floatNumbers */
	//first all flatValues
	try {
		skillTab.math.flatPart = skillTab.math.flatPart.map((currentNumber) => {
			return parseFloat(currentNumber);
		});
	} catch (err) {
		console.log('%cno flatPart for parseFloat', 'color: grey');
	}
	try {
		//second all scalingValues

		//check for multiScaling
		for (let i = 0; i < skillTab.math.scalingPart.length; i++) {
			let currentScalingPart = skillTab.math.scalingPart[i];

			if (Array.isArray(currentScalingPart[1])) {
				currentScalingPart = currentScalingPart.map((currentScalingPart) => {
					currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
						return parseFloat(currentNumber);
					});
				});
			} else {
				currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
					return parseFloat(currentNumber);
				});
			}
		}
	} catch (err) {
		console.log('%cno scalingPart for parseFloat', 'color: grey');
	}
	return skillTab;
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
export async function allSkillTabsToArray(currentAbility) {
	/** - reshapes all skillTabs from one ability to an array,
	 *  - skillTabs from one textContent stays together
	 *  - COPIES BY VALUE NOT BY REFERENCE!*/
	let skillTabArray = [];

	let textContentKeys = Object.keys(currentAbility.textContent);

	try {
		for (var tK of textContentKeys) {
			let subSkillTabArray = [];
			let skillTabKeys = Object.keys(currentAbility.textContent[tK].skillTabs);
			for (var sTK of skillTabKeys) {
				let currentSkillTab = currentAbility.textContent[tK].skillTabs[sTK];
				let copyOfSkillTab = { ...currentSkillTab };
				// let copyOfSkillTab = await tools.copyObjectByValue(currentSkillTab);
				// copyOfSkillTab.marker = 'test';
				copyOfSkillTab.concerningText = currentAbility.textContent[tK].text;
				copyOfSkillTab.concerningMeta = currentAbility.metaData;
				copyOfSkillTab = numbersToFloat(copyOfSkillTab);
				subSkillTabArray.push(copyOfSkillTab);
			}
			if (subSkillTabArray.length > 0) skillTabArray.push(subSkillTabArray);
		}
	} catch (err) {
		console.log(err);
		console.log(currentAbility);
	}
	return skillTabArray;
}
