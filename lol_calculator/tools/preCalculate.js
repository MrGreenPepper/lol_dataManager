import * as calculateTools from './calculateTools.js';
import * as tools from '../../tools/tools.js';

export async function start() {
	/** preCaciulates abilities: 1. combines ability Data with the concerning level
	 *                           2. if the marker of a skillTab is relevant for actual pre fight calculations then calculate it
	 *                               and add the stats to the preFightStats
	 *
	 */

	let championLevel = this.championLevel;
	this.soloCalc[`level${championLevel}`].abilities = {};
	let abilities = JSON.parse(JSON.stringify(this.calculated_data.abilities));

	abilities = await applyLevelsToAbilities(
		abilities,
		this.soloCalc[`level${championLevel}`].abilityLevels,
		championLevel
	);
	//i know i dont need this asignment but for better readability
	abilities = await sumSkillTabs.apply(this, [abilities]);
	this.soloCalc[`level${championLevel}`].abilities = abilities;

	return;
}

async function sumSkillTabs(rawAbilities) {
	/**divides the skillTabs into damage/dev and utility and sums them */
	let calculatedAbilities = {};
	for (let i = 0; i < 5; i++) {
		if (!Object.keys(rawAbilities[i]).length == 0) {
			let currentAbility = structuredClone(rawAbilities[i]);
			calculatedAbilities[`ability${i}`] = {};

			for (let abilityPart = 0; abilityPart < Object.keys(currentAbility).length; abilityPart++) {
				calculatedAbilities[`ability${i}`][`abilityPart${abilityPart}`] = {};
				let currentAbilityPart = currentAbility[abilityPart];

				for (let skillTabNumber = 0; skillTabNumber < currentAbilityPart.length; skillTabNumber++) {
					try {
						let currentSkillTab = currentAbilityPart[skillTabNumber];
						calculatedAbilities[`ability${i}`][`abilityPart${abilityPart}`][
							`st_flatStats${skillTabNumber}`
						] = {};
						let flatStats = {};
						//TODO: summ SkillTabs and then the abilityParts
						//filter the abiliies by markers
						switch (currentSkillTab.majorCategory) {
							case 'damage':
								flatStats = await calculateDamage.apply(this, [currentSkillTab]);
								break;
							case 'defensive':
								flatStats = await calculateDef(currentSkillTab);
								break;
							case 'utility':
								flatStats = await calculateUtility(currentSkillTab);
								break;
							//TODO: caclulate enhancer first
							case 'enhancer':
								flatStats = await calculateEnhancer(currentSkillTab);
								break;
							case 'softCC':
								flatStats = await calculateSoftCC(currentSkillTab);
								break;
							case 'hardCC':
								flatStats = await calculateHardCC(currentSkillTab);
								break;
						}
						flatStats.majorCategory = currentSkillTab.majorCategory;
						flatStats.minorCategory = currentSkillTab.minorCategory;
						flatStats.marker = currentSkillTab.marker;
						calculatedAbilities[`ability${i}`][`abilityPart${abilityPart}`][
							`st_flatStats${skillTabNumber}`
						] = flatStats;
					} catch (err) {
						console.log(err);
						console.log(`ability ${i}\t part ${abilityPart} \t sk ${skillTabNumber}`);
					}
				}
			}
		}
	}

	return calculatedAbilities;
}

async function calculateDamage(rawSkillTab) {
	let baseStats = this.soloCalc[`level${this.championLevel}`].myStats;
	let itemStats = this.soloCalc[`level${this.championLevel}`].itemStats;
	let math = rawSkillTab.math;
	let metaData = rawSkillTab.concerningMeta;
	let scalingDamage = 0;
	let flatDamage = 0;
	let summedStats = {};
	let casttime = 0;
	let cooldown = 0;

	math.flats.forEach((flatPart) => (flatDamage += flatPart[0]));
	//try gettintg casttime and cooldown
	let metaKeys = Object.keys(metaData);

	for (let key of metaKeys) {
		let currentMetaData = metaData[key];
		try {
			if (/(cast).?(time)/i.test(currentMetaData.marker)) casttime += currentMetaData.math.flatPart;
			if (/(cooldown)/i.test(currentMetaData.marker)) cooldown = currentMetaData.math.flatPart;
		} catch {}
	}

	//if its health scaling its need to be calculated later
	if (/(health)/i.test(math.flatPartType)) return rawSkillTab;

	for (let i = 0; i < math.scalings.length; i++) {
		let currentScalingPart = math.scalings[i];
		let percentageScaling;
		try {
			let percentageScaling = currentScalingPart[1].includes('%');
		} catch (err) {
			console.log(err);
			console.log('test');
		}
		let scalingFactor = currentScalingPart[0] / 100;

		//if its health scaling its need to be calculated later
		if (/(health)/i.test(currentScalingPart)) return rawSkillTab;
		//otherwise when percantage scaoling cacldulate it
		if (percentageScaling) {
			switch (currentScalingPart[1]) {
				case '% ad':
					scalingDamage += (baseStats.ad + itemStats.ad) * scalingFactor;
					break;
				case '% ap':
					scalingDamage += (baseStats.ap + itemStats.ap) * scalingFactor;
					break;
				case '% bonus ad':
					scalingDamage += itemStats.ad * scalingFactor;
					break;
				case '% bonues ap':
					scalingDamage += itemStats.ap * scalingFactor;
					break;
				case '% armor':
					scalingDamage += (baseStats.armor + itemStats.armor) * scalingFactor;
					break;
				case '% bonus armor':
					scalingDamage += itemStats.armor * scalingFactor;
					break;
				case '% bonus magic resistance':
					scalingDamage += itemStats.magicResist * scalingFactor;
					break;
				case '% bonus mana':
					scalingDamage += itemStats.mp * scalingFactor;
					break;
				case '% maximum mana':
					scalingDamage += (baseStats.mp + itemStats.mp) * scalingFactor;
					break;
				default:
					console.log('calculateDamage() - unknown scaling part', currentScalingPart);
			}
		}
	}

	summedStats.value = Math.round(flatDamage + scalingDamage);
	summedStats.casttime = casttime;
	summedStats.cooldown = cooldown;

	return summedStats;
}

async function calculateDef(rawSkillTab) {
	return rawSkillTab;
}

async function calculateUtility(rawSkillTab) {
	return rawSkillTab;
}

async function calculateEnhancer(rawSkillTab) {
	return rawSkillTab;
}
let damageMarker = [/(damage)/i];
let enhancerMarker = [/(bonus)/i, /(attack speed)/i];

async function calculateSoftCC(rawSkillTab) {
	return rawSkillTab;
}
async function calculateHardCC(rawSkillTab) {
	return rawSkillTab;
}
/*
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
*/
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
			leveledAbilities[abNumber] = [];

			for (let abPartNumber = 0; abPartNumber < abilityParts.length; abPartNumber++) {
				let skillTabs = abilityParts[abPartNumber];
				leveledAbilities[abNumber][abPartNumber] = [];

				for (let sk = 0; sk < skillTabs.length; sk++) {
					let currentSkillTab = skillTabs[sk];
					leveledAbilities[abNumber][abPartNumber][sk] = await applyLevelToSkillTabs(
						currentSkillTab,
						abilityLevels[abNumber]
					);
				}
			}
		}
	}
	return leveledAbilities;
}

async function applyLevelToSkillTabs(skillTab, currentAbilityLevel) {
	let math = skillTab.math;
	if (math != undefined) {
		for (let [index, flatPart] of math.flats.entries()) {
			if (Array.isArray(flatPart[0])) flatPart[0] = await applyLevelToMathPart(flatPart[0], currentAbilityLevel);
			math.flats[index] = flatPart;
		}

		//1. combine ability Data with the concerning level
		//first get the right flatPart numbers

		//second get the scaling value, scaling values are in an array,
		//if the second value of the array is a string its the
		//type of the scaling otherwise its a multiple scaling array
		for (let [index, scalingPart] of math.scalings.entries()) {
			//test for multiScaling
			if (scalingPart.hasOwnProperty('flats')) {
				scalingPart = await applyLevelToSkillTabs(scalingPart, currentAbilityLevel);
			} else {
				if (Array.isArray(scalingPart[0]))
					scalingPart[0] = await applyLevelToMathPart(scalingPart[0], currentAbilityLevel);
			}
			math.scalings[index] = scalingPart;
		}

		//apply level to the metaData too
		let metaKeys = Object.keys(skillTab.concerningMeta);
		for (let currentKey of metaKeys) {
			let currentMetaData = skillTab.concerningMeta[currentKey];
			if (Array.isArray(currentMetaData.math.flatPart)) {
				currentMetaData.math.flatPart = await applyLevelToMathPart(
					currentMetaData.math.flatPart,
					currentAbilityLevel
				);
			}
		}
		skillTab.math = math;
	}
	return skillTab;
}

async function applyLevelToMathPart(mathArray, abilityLevel) {
	try {
		if (mathArray.length > 1) {
			mathArray = mathArray[abilityLevel];
		} else mathArray = mathArray[0];
		return mathArray;
	} catch (err) {
		console.log(err);
	}
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
