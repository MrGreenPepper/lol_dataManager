import * as calculateTools from './calculateTools.js';
import * as tools from '../../tools.js';

export async function start() {
	/** preCaciulates abilities: 1. combines ability Data with the concerning level
	 *                           2. if the marker of a skillTab is relevant for actual pre fight calculations then calculate it
	 *                               and add the stats to the preFightStats
	 */

	let championLevel = this.championLevel;
	this.soloCalc[`level${championLevel}`].abilities = {};
	let abilities = JSON.parse(JSON.stringify(this.calculated_data.baseData.abilities));

	abilities = await applyLevelsToAbilities(abilities, this.soloCalc[`level${championLevel}`].abilityLevels, championLevel);
	//i know i dont need this asignment but for better readability
	abilities = await sumSkillTabs.apply(this, [abilities]);
	this.soloCalc[`level${championLevel}`].abilities = abilities;

	return;
}

async function sumSkillTabs(rawAbilities) {
	/**divides the skillTabs into damage/dev and utility and sums them */
	let summedAbilities;
	for (let i = 0; i < 5; i++) {
		let flatStats = {};
		if (Object.keys(rawAbilities[i]).length == 0) {
			flatStats = {};
		} else {
			let currentAbility = JSON.parse(JSON.stringify(rawAbilities[i]));
			for (let abilityPart = 0; abilityPart < Object.keys(currentAbility).length; abilityPart++) {
				let currentPart = currentAbility[abilityPart];
				for (let skillTabNumber = 0; skillTabNumber < currentPart.length; skillTabNumber++) {
					let currentSkillTab = currentPart[skillTabNumber];

					//filter the abiliies by markers
					switch (currentSkillTab.category) {
						case 'damage':
							flatStats.damage = flatStats.damage = await calculateDamage(currentSkillTab);
							break;
						case 'defensive':
							flatStats.defensive = flatStats.damage = await calculateDef(currentSkillTab);
							break;
						case 'utility':
							flatStats.utility = await calculateUtility(currentSkillTab);
							break;
						//TODO: caclulate enhancer first
						case 'enhancer':
							flatStats.enhancer = await calculateEnhancer(currentSkillTab);
							break;
						case 'softCC':
							flatStats.softCC = await calculateSoftCC(currentSkillTab);
							break;
						case 'hardCC':
							flatStats.hardCC = await calculateHardCC(currentSkillTab);
							break;
					}

					rawAbilities[i].flatStats = flatStats;
				}
			}
		}
	}
	return rawAbilities;
}

async function calculateDamage(rawSkillTab) {
	let marker = rawSkillTab.marker;
	switch (true) {
		case /.*(physical)/i.test(marker):
			return 'ad damage';
		case /(magic)/i.test(marker):
			return 'magic damage';
		case /(mixed)/i.test(marker):
			return 'mixed damage';
		case /\true/i:
			return 'true damage';
		case /(damage)/.test(marker):
			//console.log('default ad', marker);
			return 'ad damage';
	}
	return;
}

async function calculateDef() {}

async function calculateUtility(rawSkillTab) {}

async function calculateEnhancer() {}
let damageMarker = [/(damage)/i];
let enhancerMarker = [/(bonus)/i, /(attack speed)/i];

function analyseMarker(rawSkillTab) {
	let marker = rawSkillTab.marker;
	for (let i = 0; i < damageMarker.length; i++) {
		let currentRegex = damageMarker[i];
		if (currentRegex.test(marker)) return 'damage';
	}
	if (/(damage)/i.test(marker)) return 'damage';

	//bonus damage wouldnt count since damager marker are sort out above
	if (/(bonus)/i.test(marker)) return 'enhancer';
	if (/(attack speed)/i.test(marker)) return 'enhancer';
	if (/(reduction)/i.test(marker)) return 'enhancer';
	if (/(penetration)/i.test(marker)) return 'enhancer';
	if (/(buff)/i.test(marker)) return 'enhancer';

	if (/(heal)/i.test(marker)) return 'defensive';
	if (/(shield)/.test(marker)) return 'defensive';

	if (/(movement)/.test(marker)) return 'utility';
	if (/(movespeed)/i.test(marker)) return 'utility';

	if (/(disable)/.test(marker)) return 'utility';
	if (/(stun)/.test(marker)) return 'utility';
	if (/(slow)/.test(marker)) return 'utility';
	if (/(root)/.test(marker)) return 'utility';
	console.log('analyseMarker(): unknown marker:', marker);
	return 'unknown';
}

async function applyLevelsToAbilities(abilities, abilityLevels, championLevel) {
	let leveledAbilities = [];

	//now modify the copied data --> sort out the correct numbers concerning the abilityLevel
	for (let abNumber = 0; abNumber < 5; abNumber++) {
		//first check if ability is actifve at the given level and check if there are skillTabs to apply a level
		if (abilityLevels[abNumber] == -1 || abilities[abNumber] == undefined) {
			leveledAbilities.push([]);
		} else {
			//then get the abiliyParts and apply the level to them
			leveledAbilities[`${abNumber}`] = {};
			let abilityParts = abilities[abNumber];

			for (let abPartNumber = 0; abPartNumber < abilityParts.length; abPartNumber++) {
				let skillTabs = abilityParts[abPartNumber];
				leveledAbilities[abNumber][abPartNumber] = await applyLevelToSkillTabs(skillTabs, abilityLevels[abNumber]);
			}
		}
	}
	return leveledAbilities;
}

async function applyLevelToSkillTabs(abilityPart, currentAbilityLevel) {
	for (let sk = 0; sk < abilityPart.length; sk++) {
		let math = abilityPart[sk].math;

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
					currentScaling[multiPart][0] = await applyLevelToMathPart(currentScaling[multiPart][0], currentAbilityLevel);
				}
			} else {
				currentScaling[0] = await applyLevelToMathPart(currentScaling[0], currentAbilityLevel);
			}
		}
		abilityPart[sk].math = math;

		//apply level to the metaData too
		let metaKeys = Object.keys(abilityPart[sk].concerningMeta);
		for (let currentKey of metaKeys) {
			let currentMetaData = abilityPart[sk].concerningMeta[currentKey];
			if (Array.isArray(currentMetaData.math.flatPart)) {
				currentMetaData.math.flatPart = await applyLevelToMathPart(currentMetaData.math.flatPart, currentAbilityLevel);
			}
		}
	}

	return abilityPart;
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
