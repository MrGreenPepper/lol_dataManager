import * as calculateTools from './calculateTools.js';
import * as tools from '../../tools.js';
export async function start() {
	/** preCaciulates abilities: 1. combines ability Data with the concerning level
	 *                           2. if the marker of a skillTab is relevant for actual pre fight calculations then calculate it
	 *                               and add the stats to the preFightStats
	 */
	let toPreCalculateMarkers = ['defense', 'armor', 'magic resist'];
	let calculateLastIdentifier = /(missing).*?(health)/gi;
	let currentAbilityLevel = -1;

	//first copy the values
	this.soloCalc[`level${this.championLevel}`].abilities = {};
	this.soloCalc[`level${this.championLevel}`].abilities.simplified = JSON.parse(
		JSON.stringify(this.calculated_data.baseData.abilities.simplified)
	);
	this.soloCalc[`level${this.championLevel}`].abilities.simplified.calculateAtTheEnd = {};

	//now modify the copied data --> sort out the correct numbers concerning the abilityLevel
	for (let abNumber = 0; abNumber < 5; abNumber++) {
		this.soloCalc[`level${this.championLevel}`].abilities.simplified.calculateAtTheEnd[
			abNumber
		] = [];
		let abilityParts =
			this.soloCalc[`level${this.championLevel}`].abilities.simplified[`ability${abNumber}`]
				.skillTabs;
		if (abilityParts == undefined) abilityParts = [];

		if (abNumber == 0) {
			currentAbilityLevel = await getPassiveLevel(
				this.soloCalc[`level${this.championLevel}`].abilities.simplified[
					`ability${abNumber}`
				],
				this.championLevel
			);
		} else
			currentAbilityLevel =
				this.soloCalc[`level${this.championLevel}`].abilityLevels[abNumber];

		for (let abPartNumber = 0; abPartNumber < abilityParts.length; abPartNumber++) {
			try {
				let skillTabs = abilityParts[abPartNumber];
				for (let sk = 0; sk < skillTabs.length; sk++) {
					let math = skillTabs[sk].math;

					math.flatPart = await applyLevelToSkillTab(math.flatPart, currentAbilityLevel);
					//1. combine ability Data with the concerning level
					//first get the right flatPart numbers

					//second get the scaling value, scaling values are in an array,
					//if the second value of the array is a string its the
					//type of the scaling otherwise its a multiple scaling array
					for (let n = 0; n < math.scalingPart.length; n++) {
						let currentScaling = math.scalingPart[n];
						if (Array.isArray(currentScaling[1])) {
							for (
								let multiPart = 0;
								multiPart < currentScaling.length;
								multiPart++
							) {
								currentScaling[multiPart][0] = await applyLevelToSkillTab(
									currentScaling[multiPart][0],
									currentAbilityLevel
								);
							}
						} else {
							currentScaling[0] = await applyLevelToSkillTab(
								currentScaling[0],
								currentAbilityLevel
							);
						}
					}
					skillTabs[sk].math = math;
				}
			} catch (err) {
				console.log(err.message);
				console.log(err.stack);
				console.log('\npreCalculate.js: \tcant apply level to the abilities');
				console.log('currentAbility', abNumber);
				console.log('current skillTab math', math);
				tools.reportError(
					'preCalculate.js: cant apply level to the abilities',
					this.name,
					err.message,
					err.stack
				);
			}
		}

		//afterwards sort out skillTabs that needs to be calculated later ... like missing health scalings
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
									`level${this.championLevel}`
								].abilities.simplified.calculateAtTheEnd[abNumber].push(
									currentAbilityPart
								);
								return false;
							}
						}
					} else {
						if (calculateLastIdentifier.test(currentScalingPart[1])) {
							this.soloCalc[
								`level${this.championLevel}`
							].abilities.simplified.calculateAtTheEnd[abNumber].push(
								currentAbilityPart
							);
							return false;
						}
					}
				}
			}
			return true;
		});

		this.soloCalc[`level${this.championLevel}`].abilities.simplified[
			`ability${abNumber}`
		].skillTabs = abilityParts;
	}
	return;
}

async function getPassiveLevel(passiveAbility, championLevel) {
	/** analyses the passive data to return the correct concerning passiveLevel */
	// in general most passives levels depends on championLevels, but there are different scalings
	// either it scales with each level or its scales every 5 (0/5/10/15)

	//TODO: championlevel --ablevel ... now very simply abstraction
	let passiveLevel = 0;
	if (championLevel > 4) passiveLevel = 1;
	if (championLevel > 9) passiveLevel = 2;
	if (championLevel > 14) passiveLevel = 3;
	return passiveLevel;
}

async function applyLevelToSkillTab(mathArray, abilityLevel) {
	if (mathArray.length > 1) {
		mathArray = mathArray[abilityLevel];
	} else mathArray = mathArray[0];
	return mathArray;
}
