import * as flatValues from './flatValues.js';

async function start(championData) {
	/** calculates realisitc 1v1 combat stats
	 * 1. clones the theoretical stats
	 */
	this.realFightCalculation[`level${this.championLevel}`] = JSON.parse(
		JSON.stringify(this.preFightCalculations[`level${this.championLevel}`])
	);
	let currentCombatStats = this.realFightCalculation[`level${this.championLevel}`];

	//creating realFightCalculations.#level.flatDamage
	//gets the flat values for every category, especialy calculates the scaling
	currentCombatStats = await flatValues.valuesWithoutDef(currentCombatStats);

	//creating realFightCalculations.#level.realDamage
	currentCombatStats = await calculateDamageWithDef(currentCombatStats);
	currentCombatStats = await calculateAutoAttacks(currentCombatStats);
	currentCombatStats = await calculateDefStats(currentCombatStats);
	currentCombatStats = await calculateSpecials(currentCombatStats);
	currentCombatStats = await calculateExecutes(currentCombatStats);

	return currentCombatStats;
}

async function calculateDefStats(practicalAbilityValues) {
	return practicalAbilityValues;
}

async function calculateSpecials(practicalAbilityValues) {
	return practicalAbilityValues;
}

async function calculateAutoAttacks(practicalAbilityValues) {
	return practicalAbilityValues;
}

async function calculateDamageWithDef(currentCombatStats) {
	/** sorts outs the damage stats and calculates the really dealt damage concerning penetration and defensive values
	 * assigns a new damageDealt Key to the flatValues-object
	 */
	let flatValues = currentCombatStats.flatValues;
	let myStats = currentCombatStats.myStats;
	let enemyStats = currentCombatStats.enemyStats;
	let summedAD = 0;
	let summedAP = 0;
	let summedTrue = 0;

	currentCombatStats.realDamage = {};
	//loop threw abilities
	//first sort out all damage skilltabs
	for (let abKey = 0; abKey < 5; abKey++) {
		let currentAbility = flatValues[abKey];

		let damageSkillTabs = [];
		if (currentAbility != 0 && currentAbility.flatDamageValues.length > 0) {
			for (let i = 0; i < currentAbility.flatDamageValues.length; i++) {
				let currentSkillTab = currentAbility.flatDamageValues[i];
				if (currentSkillTab[1].includes('damage')) damageSkillTabs.push(currentSkillTab);
			}
			//then sort the damageSkillTabs after the damageType (magic, ad, true)
			let adSkillTabs = damageSkillTabs.filter((currentSkillTab) => {
				if (currentSkillTab[1].includes('ad')) return true;
				if (currentSkillTab[1].includes('physical')) return true;
				else return false;
			});
			let apSkillTabs = damageSkillTabs.filter((currentSkillTab) => {
				if (currentSkillTab[1].includes('magic')) return true;
				else return false;
			});
			let trueSkillTabs = damageSkillTabs.filter((currentSkillTab) => {
				if (currentSkillTab[1].includes('true')) return true;
				else return false;
			});
			//TODO: mixed damage markers: analyse the text for more information about the damage
			//calculate the real damageValues and assign the values to the abilities
			currentCombatStats.realDamage[abKey] = {};
			currentCombatStats.realDamage[abKey].ad = {};
			currentCombatStats.realDamage[abKey].ap = {};
			currentCombatStats.realDamage[abKey].true = {};

			currentCombatStats.realDamage[abKey].ad = await realDamage(
				adSkillTabs,
				[myStats.armorPenetration_percent, myStats.armorPenetration],
				enemyStats.armor
			);
			currentCombatStats.realDamage[abKey].ap = await realDamage(
				apSkillTabs,
				[myStats.magicPenetration_percent, myStats.magicPenetration],
				enemyStats.magicResist
			);
			currentCombatStats.realDamage[abKey].true = await realDamage(trueSkillTabs, [0, 0], 0);
			//next summ the values overall
			summedAD += currentCombatStats.realDamage[abKey].ad;
			summedAP += currentCombatStats.realDamage[abKey].ap;
			summedTrue += currentCombatStats.realDamage[abKey].true;
		}
	}
	currentCombatStats.realDamage.ad = summedAD;
	currentCombatStats.realDamage.ap = summedAP;
	currentCombatStats.realDamage.true = summedTrue;
	return flatValues;
	//TODO: tomorrow start implement and test the realDamage() function for ad and ap
}
async function realDamage(flatDamage, penetrationValue, defensiveValue) {
	/**
	 * @param {int} 	flatDamage
	 * @param {array}	penetrationValue	[%pene, flatPene]
	 * @param {int}		defensiveValue		concerning def value
	 *
	 */
	//TODO: redo official order is ...
	/**
	 * 		1. defensive reduction flat
	 * 		2. defensice reduction %
	 * 		3. defensive penetration %
	 * 		4. defensive penetration flat
	 * --> point 1&2 arent included yet
	 */
	let summedDamage = flatDamage.reduce((acc, currentTab) => {
		defensiveValue = defensiveValue * (1 - penetrationValue[0]);
		defensiveValue = defensiveValue - penetrationValue[1];
		let damageReduction = defensiveValue / (100 + defensiveValue);
		let realDamage = currentTab[0] * (1 - damageReduction);
		return acc + realDamage;
	}, 0);
	summedDamage = parseInt(summedDamage);
	return summedDamage;
}
async function passiveValues(passive, championLevel, myStats, enemyStats) {
	//TODO: calculate passive Values
	return passive;
}

async function sumMetaData(flatValues) {
	//loop threw abilities -> sum castTime & search for highest cooldown except ultimate
	let longestCD;
	let overallCastTime = 0;

	for (let abNumber = 1; abNumber < 5; abNumber++) {
		let currentAbility = flatValues[`ability${abNumber}`];
		//test if the current ability is already used
		if (currentAbility != 0) {
			if (longestCD == undefined) longestCD = currentAbility.cd;
			let skillTabKeys = Object.keys(currentAbility);
			//TODO:  measure summed castTime
			skillTabKeys = skillTabKeys.filter((skillTabKey) => {
				return /[0-9]/.test(skillTabKey);
			});
			//first get all markers from all skillTabs then count the appearance of different markers
			let allSkillTabMarkers = [];
			for (let i = 0; i < skillTabKeys.length; i++) {
				allSkillTabMarkers.push(currentAbility[i][1]);
			}
			let recastCounter = tools.countArrays(allSkillTabMarkers);
			recastCounter = recastCounter[0][1];
			//TODO: fix this ... every ability has a castTime
			if (!(currentAbility.castTime > -1)) currentAbility.castTime = 0;
			let sumCastTime = currentAbility.castTime * recastCounter;

			//TODO: test when the cooldown starts and get some ideas how to measure the hole rotation cooldown best
			//test for longest CD
			if (currentAbility.cd > longestCD) longestCD = currentAbility.cd;
			overallCastTime += sumCastTime;
			flatValues[`ability${abNumber}`].sumCastTime = sumCastTime;
		}
		flatValues.longestCD = longestCD;
		flatValues.overallCastTime = overallCastTime;
	}
	return flatValues;
}

async function calculateExecutes(currentCombatStats) {
	return currentCombatStats;
}
