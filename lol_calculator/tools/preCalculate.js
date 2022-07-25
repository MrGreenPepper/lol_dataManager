import * as calculateTools from './calculateTools.js';
import * as tools from '../../tools.js';

export async function start(championLevel) {
	/** preCaciulates abilities: 1. combines ability Data with the concerning level
	 *                           2. if the marker of a skillTab is relevant for actual pre fight calculations then calculate it
	 *                               and add the stats to the preFightStats
	 */

	//first copy the values
	this.soloCalc[`level${championLevel}`].abilities = {};
	let abilities = this.calculated_data.baseData.abilities.simplified;

	abilities = applyLevelsToAbilities(
		abilities,
		this.soloCalc[`level${championLevel}`].abilityLevels,
		championLevel
	);

	this.soloCalc[`level${championLevel}`].abilities = abilities;
	return;
}
async function applyLevelsToAbilities(abilities, abilityLevels, championLevel) {
	abilities = JSON.parse(JSON.stringify(abilities));
	let leveledAbilities = {};

	//now modify the copied data --> sort out the correct numbers concerning the abilityLevel
	for (let abNumber = 0; abNumber < 5; abNumber++) {
		//first check if ability is actifve at the given level and check if there are skillTabs to apply a level
		if (
			abilityLevels[abNumber] == -1 ||
			abilities[`ability${abNumber}`].skillTabs == undefined
		) {
			leveledAbilities[`ability${abNumber}`] = {};
		} else {
			//then get the abiliyParts and apply the level to them
			leveledAbilities[`ability${abNumber}`] = {};
			let abilityParts = abilities[`ability${abNumber}`].skillTabs;

			for (let abPartNumber = 0; abPartNumber < abilityParts.length; abPartNumber++) {
				let skillTabs = abilityParts[abPartNumber];
				leveledAbilities[`ability${abNumber}`][`part${abPartNumber}`] =
					await applyLevelToSkillTabs(skillTabs, abilityLevels[abNumber]);
			}
		}
	}
	return leveledAbilities;
}

async function applyLevelToSkillTabs(skillTabs, currentAbilityLevel) {
	for (let sk = 0; sk < skillTabs.length; sk++) {
		let math = skillTabs[sk].math;

		math.flatPart = await applyLevelToMathPart(math.flatPart, currentAbilityLevel);
		//1. combine ability Data with the concerning level
		//first get the right flatPart numbers

		//second get the scaling value, scaling values are in an array,
		//if the second value of the array is a string its the
		//type of the scaling otherwise its a multiple scaling array
		for (let n = 0; n < math.scalingPart.length; n++) {
			let currentScaling = math.scalingPart[n];
			if (Array.isArray(currentScaling[1])) {
				for (let multiPart = 0; multiPart < currentScaling.length; multiPart++) {
					currentScaling[multiPart][0] = await applyLevelToMathPart(
						currentScaling[multiPart][0],
						currentAbilityLevel
					);
				}
			} else {
				currentScaling[0] = await applyLevelToMathPart(
					currentScaling[0],
					currentAbilityLevel
				);
			}
		}
		skillTabs[sk].math = math;
	}

	return skillTabs;
}

async function applyLevelToMathPart(mathArray, abilityLevel) {
	if (mathArray.length > 1) {
		mathArray = mathArray[abilityLevel];
	} else mathArray = mathArray[0];
	return mathArray;
}

/** 
 * 
 * 
 * //afterwards sort out skillTabs that needs to be calculated later ... like missing health scalings
			abilityParts = abilityParts.filter((currentAbilityPart) => {
				for (let abilityPart = 0; abilityPart < currentAbilityPart.length; abilityPart++) {
					let currentSkillTab = currentAbilityPart[abilityPart];
					for (let sP = 0; sP < currentSkillTab.math.scalingPart.length; sP++) {
						let currentScalingPart = currentSkillTab.math.scalingPart[sP];
						//check for multiple scaling in one part
						if (Array.isArray(currentScalingPart[1])) {
							for (
								let multiPart = 0;
								multiPart < currentScalingPart.length;
								multiPart++
							) {
								let currentMultiPart = currentScalingPart[multiPart];
								if (calculateLastIdentifier.test(currentMultiPart[1])) {
									this.soloCalc[
										`level${championLevel}`
									].abilities.calculateAtTheEnd[abNumber].push(
										currentAbilityPart
									);
									return false;
								}
							}
						} else {
							if (calculateLastIdentifier.test(currentScalingPart[1])) {
								this.soloCalc[`level${championLevel}`].abilities.calculateAtTheEnd[
									abNumber
								].push(currentAbilityPart);
								return false;
							}
						}
					}
				}
				return true;
			});
 */
