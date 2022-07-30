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
	let summedAbilities = {};
	for (let i = 0; i < 5; i++) {
		if (!Object.keys(rawAbilities[i]).length == 0) {
			let currentAbility = JSON.parse(JSON.stringify(rawAbilities[i]));
			summedAbilities[i] = {};

			for (let abilityPart = 0; abilityPart < Object.keys(currentAbility).length; abilityPart++) {
				summedAbilities[i][abilityPart] = {};
				let currentAbilityPart = currentAbility[abilityPart];

				for (let skillTabNumber = 0; skillTabNumber < currentAbilityPart.length; skillTabNumber++) {
					let currentSkillTab = currentAbilityPart[skillTabNumber];
					summedAbilities[i][abilityPart][skillTabNumber] = {};
					let flatStats = {};
					//TODO: summ SkillTabs and then the abilityParts
					//filter the abiliies by markers
					switch (currentSkillTab.category) {
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

					summedAbilities[i][abilityPart][skillTabNumber].flatStats = flatStats;
				}
				summedAbilities[i][abilityPart].flatStats = summItUp(summedAbilities[i][abilityPart]);
			}
			summedAbilities[i].flatStats = summItUp(summedAbilities[i]);
		}
	}
	summedAbilities.flatStats = summItUp(summedAbilities);
	return rawAbilities;
}

function summItUp(flatStats) {
	if (flatStats == undefined) return {};
	return flatStats;
}

async function calculateDamage(rawSkillTab) {
	let baseStats = this.soloCalc[`level${this.championLevel}`].myStats;
	let itemStats = this.soloCalc[`level${this.championLevel}`].itemStats;
	let math = rawSkillTab.math;
	let metaData = rawSkillTab.concerningMeta;
	let scalingDamage = 0;
	let flatDamage = math.flatPart;
	let summedStats = {};
	let casttime = 0;
	let cooldown = 0;

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

	for (let i = 0; i < math.scalingPart.length; i++) {
		let currentScalingPart = math.scalingPart[i];
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

	summedStats.damage = Math.round(flatDamage + scalingDamage);
	summedStats.casttime = casttime;
	summedStats.cooldown = cooldown;
	summedStats.category = rawSkillTab.category;
	summedStats.marker = rawSkillTab.marker;

	return summedStats;
}

async function calculateDef() {}

async function calculateUtility(rawSkillTab) {}

async function calculateEnhancer() {}
let damageMarker = [/(damage)/i];
let enhancerMarker = [/(bonus)/i, /(attack speed)/i];

async function calculateSoftCC() {}
async function calculateHardCC() {}
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
