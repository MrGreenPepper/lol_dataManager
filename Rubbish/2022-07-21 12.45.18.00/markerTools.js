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
