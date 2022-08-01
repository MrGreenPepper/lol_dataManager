export async function start() {
	/**divides the skillTabs into damage/dev and utility and sums them */
	let summedAbilities = {};
	let originAbilities = this.soloCalc[`level${this.championLevel}`].abilities;

	for (let i = 0; i < 5; i++) {
		if (originAbilities.hasOwnProperty(`ability${i}`)) {
			let currentOriginAbility = structuredClone(originAbilities[`ability${i}`]);
			summedAbilities[i].summedParts = {};
			summedAbilities[i].originParts = {};

			for (let abilityPart = 0; abilityPart < Object.keys(currentOriginAbility).length; abilityPart++) {
				summedAbilities[i].summedParts[abilityPart] = {};
				summedAbilities[i].originParts[abilityPart] = {};
				let currentOriginAbilityPart = currentOriginAbility[abilityPart];

				originAbilities[i][`summed_abilityPart${abilityPart}`] = summItUp(currentOriginAbilityPart);
			}

			summedAbilities[i] = summItUp(summedAbilities[i]);
		} else {
			originAbilities[i] = {};
		}
	}
	summedAbilities = summItUp(summedAbilities);
	this.soloCalc[`level${this.championLevel}`].summedAbilities = summedAbilities;
}

function summItUp(flatStats) {
	let summedFlatStats = {};
	let objKeys = Object.keys(flatStats);
	//test if there are more then one flatStat to sum
	if (objKeys.length > 1) {
		for (let i = 0; i < objKeys.length; i++) {
			let flatStatsPrim = flatStats[objKeys[i]];
			for (let n = i; n < objKeys.length; n++) {
				let flatStatsMinor = flatStats[objKeys[n]];

				let compareMajor = flatStatsPrim.majorCategory;
				let compareMinor = flatStatsPrim.minorCategory;
				let toCompareMajor = flatStatsMinor.majorCategory;
				let toCompareMinor = flatStatsMinor.minorCategory;

				//if both flatStats have the same concern then add them
				if (compareMajor == toCompareMajor && compareMinor == toCompareMinor) {
					let primKeys = Object.keys(flatStatsPrim);
					let minorKeys = Object.keys(flatStatsMinor);

					for (let currentKey of primKeys) {
						if (!isNaN(flatStatsPrim[currentKey] && minorKeys.includes(currentKey) && !/(cooldown)/.test(currentKey))) {
							flatStatsPrim[currentKey] += flatStatsMinor[currentKey];
						}
					}

					Object.assign(summedFlatStats, flatStatsPrim);
				} else {
					Object.assign(summedFlatStats, flatStatsPrim);
					Object.assign(summedFlatStats, flatStatsMinor);
				}
			}
		}
		return summedFlatStats;
	} else {
		if (flatStats == undefined) return {};
		return flatStats;
	}
}

function addMath(mathMajor, mathSecond) {}
