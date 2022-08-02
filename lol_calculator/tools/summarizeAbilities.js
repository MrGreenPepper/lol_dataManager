export async function start() {
	/**divides the skillTabs into damage/dev and utility and sums them */
	let summedAbilities = {};
	let originAbilities = this.soloCalc[`level${this.championLevel}`].abilities;

	for (let i = 0; i < 5; i++) {
		summedAbilities[i] = {};
		if (originAbilities.hasOwnProperty(`ability${i}`)) {
			let currentOriginAbility = structuredClone(originAbilities[`ability${i}`]);
			summedAbilities[i].summarized = {};
			summedAbilities[i] = summItUp(currentOriginAbility);

			/*
			for (let abilityPart = 0; abilityPart < Object.keys(currentOriginAbility).length; abilityPart++) {
				summedAbilities[i].summedParts[abilityPart] = {};
				summedAbilities[i].originParts[abilityPart] = {};
				let currentOriginAbilityPart = currentOriginAbility[`abilityPart${abilityPart}`];

				originAbilities[i][`summed_abilityPart${abilityPart}`] = summItUp(currentOriginAbilityPart);
			}*/
		} else {
			summedAbilities[i] = {};
		}
	}

	this.soloCalc[`level${this.championLevel}`].summedAbilities = summedAbilities;
}

function summItUp(propertyContainer) {
	let summedFlatStats = {};
	let mergedPool = [];
	//generate an array with all posible paths to loop threw
	let propertyPaths = getThePaths(propertyContainer);

	//test if there are more then one flatStat to sum
	if (propertyPaths.length > 1) {
		for (let i = 0; i < propertyPaths.length - 1; i++) {
			let compareMajor = propertyContainer[propertyPaths[i][0]][propertyPaths[i][1]];

			//test if majorProperty is already merged into another stat
			if (!mergedPool.includes(i)) {
				for (let n = i + 1; n < propertyPaths.length; n++) {
					let compareMinor = propertyContainer[propertyPaths[n][0]][propertyPaths[n][1]];
					let addedProperties = tryAddTwoSkillProperties(compareMajor, compareMinor);
					//test if addedProperties is an object(=merged something) or is it an array(the two original old ones)
					if (!Array.isArray(addedProperties)) {
						compareMajor = addedProperties;
						//cut the second out of the pool the first one wont the be considered a second time anyways
						mergedPool.push(n);
					}
				}
				//at the end assign the compoareMajor
				Object.assign(summedFlatStats, [compareMajor]);
			}
		}
		return summedFlatStats;
	} else {
		if (propertyContainer == undefined) return {};
		return propertyContainer;
	}
}

function getThePaths(propertyContainer) {
	let pathArray = [];
	let primKeys = Object.keys(propertyContainer);

	for (let currentPrimKey of primKeys) {
		let secKeys = Object.keys(propertyContainer[currentPrimKey]);
		for (let currentSecKey of secKeys) {
			pathArray.push([currentPrimKey, currentSecKey]);
		}
	}
	return pathArray;
}

function tryAddTwoSkillProperties(propertyOne, propertyTwo) {
	//if both flatStats have the same concern then add them
	propertyOne = structuredClone(propertyOne);
	propertyTwo = structuredClone(propertyTwo);
	if (propertyOne.majorCategory == propertyTwo.majorCategory && propertyTwo.minorCategory == propertyOne.minorCategory) {
		let summedProperty = {};
		//controll if propertyOne is an already merged object
		if (propertyOne.hasOwnProperty('origin')) {
			propertyOne.origin.push(propertyTwo);
			summedProperty.origin = propertyOne.origin;
		}
		summedProperty.origin = [];
		summedProperty.origin.push(propertyOne, propertyTwo);
		let propertyKeys = Object.keys(propertyOne);

		for (let currentKey of propertyKeys) {
			if (!isNaN(propertyOne[currentKey]) && !/(cooldown)/i.test(currentKey)) {
				let value = propertyOne[currentKey] + propertyTwo[currentKey];
				//round to 1 digit
				value = value.toFixed(1);
				summedProperty[currentKey] = Number(value);
			} else {
				summedProperty[currentKey] = propertyOne[currentKey];
			}
		}

		return summedProperty;
	} else {
		return [propertyOne, propertyTwo];
	}
}
