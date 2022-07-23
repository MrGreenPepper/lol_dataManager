export async function metaNumbersToFloat(championData) {
	let championAbilities = championData.lol_extractor.baseData.abilities;
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];

		let metaKeys = Object.keys(currentAbility.metaData);

		for (let currentMetaKey of metaKeys) {
			let currentMetaData = currentAbility.metaData[currentMetaKey];
			if (Array.isArray(currentMetaData.math.flatPart))
				currentMetaData.math.flatPart = currentMetaData.math.flatPart.map(
					(currentFlatPart) => {
						return parseFloat(currentFlatPart);
					}
				);
		}
	}
	return championData;
}

async function cleanEmptyTextContent(currentAbility) {
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
async function applyToAllSkillTabs(skillTabs, applyFunction) {
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
async function allSkillTabsToArray(currentAbility) {
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

async function numbersToFloat(skillTab) {
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

export function getActiveMarkers(currentMarker, text, type) {
	let testIntervalls = [];
	for (let n = 0; n < currentMarker.length; n++) {
		let position = text.toLowerCase().indexOf(currentMarker[n]);
		if (position > -1) currentMarker[n] = [currentMarker[n], true, position];
		else currentMarker[n] = [currentMarker[n], false, -1];

		// sort the currentMarker by there apperance to slide the text later
		currentMarker.sort((a, b) => {
			if (a[2] > b[2]) return 1;
			if (a[2] < b[2]) return -1;
			return 0;
		});

		let activeMarkers = currentMarker.filter((element) => {
			return element[1];
		});

		// get the possible maximum length for the  intervalls to check them later
		for (i = 0; i < activeMarkers.length; i++) {
			// for the last marker the maximum end is equal to the end of the text
			if (i + 1 == activeMarkers.length) {
				testIntervalls[i] = [];
				testIntervalls[i][0] = activeMarkers[i][2];
				testIntervalls[i][1] = text.length;
			} else {
				testIntervalls[i] = [];
				testIntervalls[i][0] = activeMarkers[i][2];
				testIntervalls[i][1] = activeMarkers[i + 1][2];
			}
		}
		//check the intervalls
		for (i = 0; i < testIntervalls.length; i++) {
			let lastNumberIndex = 0;
			let testText = text.slice(testIntervalls[i][0], testIntervalls[i][1]);
			//prepare the testText
			testText = testText.toLowerCase();
			testText.replace(activeMarkers[i][1], '');
			testText = testText.replace(/a, b, n/g, '');

			// at the first num jump into the "math sign mode" until a char appears then return the index of the last number
			console.log('origin testText: ', testText);
			/*let slicepoint = 1;
		for (let n = 0; n < testText.length; n++) {
			if (!markers_isItMath(testText.charAt(n))) 
                {testText = testText.slice(slicepoint);}
                else {
                	slicepoint++;
                }

		}*/
			activeMarkers[(i, 3)] = testText;
		}
		return activeMarkers;
	}
}
