export async function metaNumbersToFloat(championData) {
	let championAbilities = championData.lol_extractor.baseData.abilities;
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];

		let metaKeys = Object.keys(currentAbility.metaData);

		for (let currentMetaKey of metaKeys) {
			let currentMetaData = currentAbility.metaData[currentMetaKey];
			if (Array.isArray(currentMetaData.math.flatPart))
				currentMetaData.math.flatPart = currentMetaData.math.flatPart.map(
					(currentFlatPart) => {
						return parseFloat(currentFlatPart);
					}
				);
		}
	}
	return championData;
}
