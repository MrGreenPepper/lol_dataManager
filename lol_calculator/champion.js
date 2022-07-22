'use strict';
import fs from 'fs';
import * as championTools from './tools/championTools.js';
import * as itemTools from './tools/itemTools.js';
import * as goldTools from './tools/goldTools.js';
import * as preCalculate from './tools/preCalculate.js';
import * as realCalculate from './tools/realCalculate.js';
import * as tools from '../tools.js';

const DATAPATH = './data/champions/';

class Champion {
	constructor(championName) {
		this.championName = championName;

		let tempData = JSON.parse(
			fs.readFileSync(`${DATAPATH}${this.championName}_data.json`, 'utf8')
		);
		let dataKeys = Object.keys(tempData);
		// copies the data, per key, from the loaded one
		for (let key of dataKeys) {
			this[key] = tempData[key];
		}

		this.calculatedData = {};
		this.calculatedData.perSecond = {};
		this.calculatedData.oneRotation = {};
		this.soloCalc = {};
		this.realFightCalculation = {};
		//TODO: do warnings for like crits or any special abilities
		this.warnings = {};
	}
	async _initialize() {
		await this.loadItemData();
		return this;
	}
	async preCalculateFight(championLevel) {
		this.championLevel = championLevel;
		this.soloCalc[`level${this.championLevel}`] = {};

		await this.setAbilityLevels();
		//creates this.preFightCalculations[level].myStats and calculates the base values
		await this.calculateBaseCombatStats();
		await this.addItemValuesAtThisLevel();

		//preCalculates abilities and optionally modify stats
		await preCalculate.start.apply(this);

		return;
	}

	async calculateRealCombatStats() {
		this.calculated_data.matchup[`level${this.championLevel}`] = {};
		await realCalculate.start.apply(this);
		// this.combatStats[`level${this.championLevel}`].specialValues.damagePerRotation =
		// 	valueTools.damagePerRotation(this);
		// this.combatStats[`level${this.championLevel}`].specialValues.damagePerSecond =
		// 	valueTools.damagePerSecond(this);
		return;
		// this.calculatedData.perSecond[i] = {};
		// this.calculatedData.oneRotation[i] = {};
		// this.calculatedData.oneRotation[i] = await rotationTools.rotationValue(this, i);
		// this.calculatedData.perSecond[i] = await perSecondTools.psValue(this, i);
		//TODO: add flat stats from abilities to the champion.fightStats
		/**this.calculateAllAbilitiesDamage();
			this.calculateUtility();
			this.calculateSpecials();
			this.summarizeData();
			this.calculateDamage(i);*/
	}

	async calculateBaseCombatStats() {
		/** calculate the rotation and dpsjdamage of all levels */
		let champLevel = this.championLevel;
		let baseStats = this.calculated_data.baseData.baseStats;
		this.soloCalc[`level${this.championLevel}`].myStats = {};
		let myStats = {};
		myStats.championLevel = this.championLevel;
		myStats.ap = 0;
		myStats.baseAD = baseStats.ad + baseStats.ad_plus * champLevel;
		myStats.ad = baseStats.ad + baseStats.ad_plus * champLevel;
		//TODO: ?--> myStats.attackRange = baseStats.ar + baseStats.ar_plus * champLevel;
		myStats.attackSpeed = baseStats.as + baseStats.as_plus * champLevel;
		myStats.hp = baseStats.hp + baseStats.hp_plus * champLevel;
		myStats.hp5 = baseStats.hp5 + baseStats.hp5_plus * champLevel;
		myStats.magicPenetration = baseStats.mp + baseStats.mp_plus * champLevel;
		myStats.magicResist = baseStats.mr + baseStats.mr_plus * champLevel;
		myStats.armor = baseStats.ar + baseStats.ar_plus * champLevel;
		myStats.movementSpeed = baseStats.ms;
		myStats.cd = baseStats.cd = 0;
		myStats.range = baseStats.range;
		myStats.windup = baseStats.windup;

		this.soloCalc[`level${this.championLevel}`].myStats = myStats;
		return;
	}

	async setGold() {
		this.goldAmount = await goldTools.getGoldAmount(this.championLevel);
	}

	async loadItemData() {
		this.calculated_data.inGameData.itemData = {};
		this.calculated_data.inGameData.itemData = await itemTools.loadItems(
			this.analysed_data.inGameData.items
		);
		let itemOrder = [];
		let itemData = this.calculated_data.inGameData.itemData;
		//TODO: hard coded itemOrder
		itemOrder.push(...itemData.startItems);
		itemOrder.push(itemData.coreItems[0]);
		itemOrder.push(itemData.boots);
		itemOrder.push(itemData.coreItems[1]);
		itemOrder.push(itemData.coreItems[2]);
		itemOrder.push(itemData.endItems[0]);
		itemOrder.push(itemData.endItems[1]);
		itemOrder.push(itemData.endItems[2]);
		this.calculated_data.inGameData.itemOrder = itemOrder;
	}

	async setAbilityLevels() {
		return new Promise((resolve) => {
			let abilityLevels = {};
			abilityLevels['1'] = -1;
			abilityLevels['2'] = -1;
			abilityLevels['3'] = -1;
			abilityLevels['4'] = -1;
			let skillOrder = this.analysed_data.inGameData.skillOrder;

			for (let i = 0; i < this.championLevel + 1; i++) {
				switch (skillOrder[i]) {
					case 'Q':
						abilityLevels['1']++;
						resolve();
						break;
					case 'W':
						abilityLevels['2']++;
						resolve();
						break;
					case 'E':
						abilityLevels['3']++;
						resolve();
						break;
					case 'R':
						abilityLevels['4']++;
						resolve();
						break;
				}
			}
			this.soloCalc[`level${this.championLevel}`].abilityLevels = abilityLevels;
		});
	}

	async addItemValuesAtThisLevel() {
		//generate fight stats to calculate with later
		let currentBaseStats = this.soloCalc[`level${this.championLevel}`].myStats;
		currentBaseStats.omniVamp = 0;
		currentBaseStats.lifeSteal = 0;
		currentBaseStats.magicPenetration = 0;
		currentBaseStats.magicPenetration_percent = 0;
		currentBaseStats.crit = 0;
		currentBaseStats.armorPenetration = 0;
		currentBaseStats.armorPenetration_percent = 0;

		//get the maximum available items at the current level
		try {
			let goldAmount = await goldTools.getGoldAmount(this.championLevel);
			let boughtItems = await itemTools.calculateItems(
				this.calculated_data.inGameData.itemOrder,
				goldAmount
			);
			let summedItemStats = await itemTools.sumItemStats(boughtItems);

			let statsCategories = Object.keys(summedItemStats);

			// at flat values then the percentValues
			statsCategories.forEach((currentCategory) => {
				switch (currentCategory) {
					case 'ad':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'crit':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'attackSpeed_percent':
						//TODO: control attack speed calculation
						currentBaseStats.attackSpeed +=
							(summedItemStats[currentCategory] / 100 + 1) *
							currentBaseStats.attackSpeed;
						break;
					case 'armorPenetration':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'armorPenetration_percent':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
					case 'lethality':
						currentBaseStats.armorPenetration +=
							summedItemStats[currentCategory] *
							(0.6 + (0.4 * (this.championLevel + 1)) / 18);
						break;
					case 'lifeSteal_percent':
						currentBaseStats.lifeSteal += summedItemStats[currentCategory] / 100;
						break;

					case 'ap':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'magicPenetration':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'magicPenetration_percent':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'omnivamp_percent':
						currentBaseStats.omniVamp += summedItemStats[currentCategory] / 100;
						break;

					case 'cd':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'ms':
						currentBaseStats.movementSpeed += summedItemStats[currentCategory];
						break;

					case 'hp':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'hp5':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'extraHP_percent':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
					case 'armor':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;
					case 'magicResist':
						currentBaseStats[currentCategory] += summedItemStats[currentCategory];
						break;

					// add percentValues
					case 'hp5_percent':
						currentBaseStats.hp5 +=
							(summedItemStats[currentCategory] / 100) * currentBaseStats.hp5;
						break;
					case 'ms_percent':
						currentBaseStats[currentCategory].movementSpeed +=
							(summedItemStats[currentCategory] / 100) *
							currentBaseStats.movementSpeed;
						break;
					default:
						console.log('cant add itemStat: ', currentCategory);
				}
			});

			//TODO: calculate fight stats (ABILITIES!!!, potions, masteries etc.)
		} catch (err) {
			console.log('cant get items: ', err);
		}

		this.soloCalc[`level${this.championLevel}`].myStats = currentBaseStats;
	}
}

export async function create(championName) {
	try {
		let champion = new Champion(championName);
		await champion._initialize();
		return champion;
	} catch (error) {
		console.log(error);
		return Promise.reject(error);
	}
}
