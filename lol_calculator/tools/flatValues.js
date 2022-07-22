import * as calculateTools from './calculateTools.js';

async function valuesWithoutDef(currentCombatStats) {
	/**loop threw abilities sortOut the skillTabs and start the correct calculations by calculating scaleParts and adds them to the flatPart
	 * afterwards sum it up
	 */
	let damageIdentifier = /damage/gi;
	let defIdentifier = /def/gi;
	let specialIdentifier = /special/gi;

	let damageSkillTabs = [];
	let defSkillTabs = [];
	let specialSkillTabs = [];

	let myStats = currentCombatStats.myStats;
	let enemyStats = currentCombatStats.enemyStats;
	let currentAbility;
	let currentAbilityLevel;
	currentCombatStats.flatValues = {};

	//loop threw abilities sortOut the skillTabs and start the correct calculations
	for (let i = 0; i < 5; i++) {
		currentAbility = currentCombatStats.abilities[`ability${i}`];
		currentCombatStats.flatValues[i] = {};
		currentCombatStats.flatValues[i].flatDamageValues = [];
		damageSkillTabs = [];
		defSkillTabs = [];
		specialSkillTabs = [];

		// check if are skillTabs in the ability to calculate
		if (Object.keys(currentAbility).length > 0) {
			//sort out damage, def, and special skillTabs
			damageSkillTabs = currentAbility.skillTabs.filter((currentSkillTab) => {
				if (damageIdentifier.test(currentSkillTab.marker)) return true;
			});
			defSkillTabs = currentAbility.skillTabs.filter((currentSkillTab) => {
				if (defIdentifier.test(currentSkillTab.marker)) return true;
			});
			specialSkillTabs = currentAbility.skillTabs.filter((currentSkillTab) => {
				if (specialIdentifier.test(currentSkillTab.marker)) return true;
			});

			currentCombatStats.flatValues[i].flatDamageValues = await calculateDamageSkillTabs(
				damageSkillTabs,
				currentCombatStats
			);
			currentCombatStats.flatValues[i].defValues = await calculateDefValues(
				defSkillTabs,
				currentCombatStats
			);
			currentCombatStats.flatValues[i].specialValues = await calculateSpecialValues(
				specialSkillTabs,
				currentCombatStats
			);
			currentCombatStats.flatValues[i].metaData = await calculateMeta(
				currentAbility.metaData
			);
		}
	}
	currentCombatStats.flatValues.autoAttacks = await calculateFlatAutoAttacks(
		currentCombatStats.myStats
	);
	return currentCombatStats;
}

async function calculateFlatAutoAttacks(myStats) {
	let autoAttacks_onHit = myStats.ad;
	let autoAttacks_dps = 0;
	let autoAttacks = {};
	autoAttacks.flat = {};

	autoAttacks_dps = myStats.ad * myStats.attackSpeed;

	autoAttacks.flat.range = myStats.range;
	autoAttacks.flat.dps = autoAttacks_dps;
	autoAttacks.flat.onHit = autoAttacks_onHit;
	return autoAttacks;
}

async function calculateMeta(metaData, abilityLevel) {
	//** old stuff: just gets the right values from the metaData, but i already sort it in preCalculate */
	// let calculatedMetaData = {};
	// let metaDataKeys = Object.keys(metaData);

	// for (metaKey of metaDataKeys) {
	//     switch (metaKey) {
	//         case 'cd':
	//             let time = Object.values(metaData[metaKey].time);
	//             if (time.length > 1) calculatedMetaData.cd = [abilityLevel];
	//             else calculatedMetaData.cd = time[0];
	//             break;
	//         case 'castTime':
	//             let castTime = Object.values(metaData[metaKey].time);
	//             if (castTime.length > 1) calculatedMetaData.castTime = castTime[abilityLevel];
	//             else calculatedMetaData.castTime = castTime[0];
	//             break;
	//         default:
	//             console.log('unknown metaKey: \t', metaKey);
	//     }
	// }

	// return calculatedMetaData;
	return metaData;
}
async function calculateDamageSkillTabs(damageSkillTabs, currentCombatStats) {
	/** gets the skill
	 * @input damageSkillTabs  - [array] - all damageSkillTabs from one ability
	 * @return skillTabValues - [array] - summed damage values per skillTab
	 * 1. the flat damage
	 * 2. the scaling damage
	 * 3. get the valueType
	 * 4. summarize all up
	 */

	let calculatedValues = [];
	let currentSkillTab = [];
	let skillTabType = [];
	let flatValue = 0;
	let scalingValue = 0;
	let summedValue;

	for (let i = 0; i < damageSkillTabs.length; i++) {
		currentSkillTab = damageSkillTabs[i];
		try {
			flatValue = currentSkillTab.math.flatPart;
			scalingValue = await calculateScalingPart(
				currentSkillTab.math.scalingPart,
				currentCombatStats
			);
			summedValue = flatValue + scalingValue;

			// skillTabType = await getSkillTabTyp(currentSkillTab);
			skillTabType = currentSkillTab.marker;

			calculatedValues.push([summedValue, skillTabType]);
		} catch (error) {
			console.log(error);
		}
	}

	return calculatedValues;
}

async function calculateScalingPart(scalingPart, currentCombatStats) {
	//returns the one Value for the scalingPart of a skillTab;
	let myStats = currentCombatStats;
	let enemyStats = currentCombatStats;

	let currentScalingPart = [];
	let scalingValue = 0;

	for (let sCpart = 0; sCpart < scalingPart.length; sCpart++) {
		currentScalingPart = scalingPart[sCpart];
		//check for multiple scaling in one part
		if (Array.isArray(currentScalingPart[1])) {
			//adds the innerScaling Values to the initial scaling value of the this scalingPart
			for (let multiPart = 1; multiPart < currentScalingPart.length; multiPart++) {
				currentScalingPart[0][0] += await combineScaleValueAndIdentifier(
					currentScalingPart[multiPart],
					myStats,
					enemyStats
				);
				scalingValue = await combineScaleValueAndIdentifier(
					currentScalingPart[0],
					myStats,
					enemyStats
				);
			}
		} else {
			scalingValue = await combineScaleValueAndIdentifier(
				currentScalingPart,
				myStats,
				enemyStats
			);
		}
	}

	return scalingValue;
}

async function combineScaleValueAndIdentifier(scalePart, myStats, enemyStats) {
	/* gets the right value for the identifier and the calculation method afterwards calculats the sum with the initial value */

	let initialValue = scalePart[0];
	let identifier = scalePart[1];
	let percentCalculation = false;
	let identifierValue = 0;
	let scalingPartValue = 0;
	//get the value for the identifier
	switch (true) {
		//TODO: of the targets missing health (idea: summ all other damage skillTabs and calculate it afterwards)
		case /bonus ad/gi.test(identifier):
			identifierValue = myStats.ad - myStats.baseAD;
			break;
		case /(per).*?(mark)/gi.test(identifier): //kindred
			//TODO: more decent calculation
			identifierValue = Math.floor(myStats.championLevel / 2);
			identifier = identifier.replace(/%/gi, '');
			break;
		case /(of).*?(target).*?(current).*?(health)/gi.test(identifier):
			identifierValue = enemyStats.hp;
			break;
		default:
			console.log('cant identify scaling identifier', identifier);
	}

	//get the calculation method
	if (/%/g.test(identifier)) {
		scalingPartValue = (initialValue / 100) * identifierValue;
	} else {
		scalingPartValue = initialValue * identifierValue;
		console.log('no calculation defined yet');
	}
	return scalingPartValue;
}

async function getSkillTabTyp(skillTab) {
	//TODO: contorl if this part isn necessary, cause the few markers I saw seems to be pretty precis doing the overall calc with it, then go farther
	/** first check for word combinations then for single words */
	let markerArrayFinal = [];
	let combString = skillTab.marker.toLowerCase();
	//word combination check
	let wordCombinations = ['attack speed', 'cooldown reduction'];
	for (wordComb of wordCombinations) {
		if (combString.includes(wordComb)) {
			markerArrayFinal.push(wordComb);
			combString = combString.replace(wordComb, '');
		}
	}

	//single words check
	combString = combString.trim();
	markerArrayFinal = combString.split(' ');

	//just testing if I have all markers
	markerArrayFinal.forEach((currentWord) => {
		switch (currentWord) {
			case 'damage':
				return 'damage';
				break;
			case 'physical':
				return 'ad';
				break;
			case 'shield':
				return 'shield';
				break;
			case 'health':
				return 'health';
				break;
			case 'magic':
				return 'magic';
				break;
			case 'heal':
				return 'heal';
				break;
			case 'movement':
				return 'movement';
				break;
			case 'disable':
				return 'disable';
				break;
			case 'armor':
				return 'armor';
				break;
			case 'mr':
				return 'mr';
				break;
			case 'resistances':
				return 'resistances';
				break;
			case 'silence':
				return 'silence';
				break;
			case 'blind':
				return 'blind';
				break;
			case 'recasts':
				return 'recasts';
				break;
			case 'slow':
				return 'slow';
				break;
			case 'immunity':
				return 'immunity';
				break;
			default:
				//console.log('unknown skillTab marker: \t', currentWord);
				return undefined;
		}
	});
	markerArrayFinal = markerArrayFinal.filter((currentWord) => currentWord != undefined);
	if (
		markerArrayFinal.includes('damage') &&
		!markerArrayFinal.includes('magic') &&
		!markerArrayFinal.includes('ad')
	)
		markerArrayFinal.push('ad');

	//console.log(markerArrayFinal.includes('damage'));
	//console.log(markerArrayFinal.includes('magic'));
	if (markerArrayFinal.length == 0) console.log(`cant specify marker type ${skillTab.marker}`);
	else return markerArrayFinal;
}
async function calculateDefValues(defSkillTabs, currentCombatStats) {}
async function calculateSpecialValues(specialSkillTabs, currentCombatStats) {}
