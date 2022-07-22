async function applyToAllScalinParts(scalingPart, executeFunction) {
	return scalingPart;
}
async function getStraightAbilityValues(championData) {
	let abilityValueContainer = {};
	let myStats = championData.combatStats[`level${championData.championLevel}`].myStats;
	let enemyStats = championData.enemyStats;
	let summarizedAbilities = championData.abilities.simplifiedAbilities;

	abilityValueContainer.passive = await passiveValues(
		summarizedAbilities.ability0,
		championData.championLevel,
		myStats,
		enemyStats
	);

	for (let i = 1; i <= 4; i++) {
		try {
			let finalSkillTabArray = [];
			let currentAbilityLevel = championData.abilities.abilityLevels[i];

			let summarizedAbility = summarizedAbilities[`ability${i}`];
			//TODO: try catch Workaround
			if (currentAbilityLevel > -1) {
				let skillTabKeys = Object.keys(summarizedAbility.skillTabs);
				/** differs the  methaData, and loops threw the rest of the skillTabs of the ability */
				metaData = await calculatedMetaData(
					summarizedAbility.metaData,
					currentAbilityLevel
				);

				for (key of skillTabKeys) {
					let currentSkillTab = summarizedAbility.skillTabs[key];
					let skillTabValue = await preCalculateSkillTab(
						currentSkillTab,
						currentAbilityLevel,
						myStats
					);
					finalSkillTabArray.push(skillTabValue);
				}

				abilityValueContainer[`ability${i}`] = Object.assign(metaData, finalSkillTabArray);
			} else abilityValueContainer[`ability${i}`] = 0;
		} catch {
			abilityValueContainer[`ability${i}`] = 0;
		}
	}
	return abilityValueContainer;
}
async function preCalculateSkillTab(skillTab, abilityLevel, myStats) {
	// there are abilities who modify the combatsStats like more armor, they need to be pre calculated before the combatsStats are transmitted
	let toPreCalculateMarkers = ['armor', 'magic resist'];

	if (toPreCalculateMarkers.includes(skillTab.marker)) {
		/** calculates the numbers of a skillTab to a current level
		 * 1. the flat damage
		 * 2. the scaling damage
		 * 3. get the valueType
		 * 4. summarize all up
		 */
		let preSkillTabType = [];
		let preFlatValue = 0;
		let preScalingValue = 0;
		let summedValue;
		try {
			preFlatValue = await getFlatValue(skillTab, abilityLevel, myStats);
			preScalingValue = await getScaleValue(skillTab, abilityLevel, myStats);
			preSkillTabType = await getSkillTabTyp(skillTab);
		} catch (error) {
			console.log(error);
		}

		return [preFlatValue, preScalingValue, preSkillTabType];
	} else return skillTab;
}

function areArraysSimilar(testArray1, testArray2) {
	let length1 = testArray1.length;
	let length2 = testArray2.length;
	let testValue = true;
	if (length1 != length2) {
		//console.log("length differ");
		return false;
	}

	for (let i = 0; i < length2; i++) {
		if (testArray1[i] != testArray2[i]) testValue = false;
	}

	return testValue;
}

function countArrays(multiArray) {
	let uniqueArrays = [];

	for (let i = 0; i < multiArray.length; i++) {
		let currentTestArray = multiArray[i];
		let alreadyIncluded = false;
		let counter = 0;
		//check if the array is already processed
		for (let n = 0; n < uniqueArrays.length; n++) {
			if (areArraysSimilar(currentTestArray, uniqueArrays[n][0])) alreadyIncluded = true;
		}
		//if array is new add it to the unque arrays and count it
		if (!alreadyIncluded) {
			for (let c = 0; c < multiArray.length; c++) {
				if (areArraysSimilar(currentTestArray, multiArray[c])) counter++;
			}

			uniqueArrays.push([currentTestArray, counter]);
		}
	}
	uniqueArrays = uniqueArrays.sort((a, b) => {
		return b[1] - a[1];
	});

	return uniqueArrays;
}
