import * as tools from '../tools.js';

const CHAMPIONSAVEPATH = './data/champions/';
export async function objectsToArrays() {
	/**parses the abilityParts from the textContent of every Skill into an Array, also parses the skillTabs of every abilityPart
	 * into an array for easier workflow later */
	let textContentArray = [];
	let skillTabArray = [];
	let abilityData;

	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;

		try {
			let championData = await tools.loadJSONData(`${CHAMPIONSAVEPATH}${championName}_data.json`);
			abilityData = championData.extracted_data.baseData.abilities;

			let abilityDataKeys = Object.keys(abilityData);
			for (let abilityNumber of abilityDataKeys) {
				let currentAbility = abilityData[abilityNumber];
				let textContentKeys = Object.keys(currentAbility.textContent);
				textContentArray = [];
				for (let abPartNumber of textContentKeys) {
					let currentTextContent = abilityData[abilityNumber].textContent[abPartNumber];
					let skillTabKeys = Object.keys(currentTextContent.skillTabs);

					skillTabArray = [];
					for (let skillTabNumber of skillTabKeys) {
						skillTabArray.push(currentTextContent.skillTabs[skillTabNumber]);
					}
					currentTextContent.skillTabs = skillTabArray;
					textContentArray.push(currentTextContent);
				}

				abilityData[abilityNumber].textContent = textContentArray;
			}

			//championData.extracted_data.baseData.abilities = abilityData;	not	needed, cause objects, just for readability

			await tools.saveJSONData(championData, `${CHAMPIONSAVEPATH}${championName}_data.json`);
		} catch (err) {
			console.log();
			console.log(err.message);
			console.log(err.stack);
		}
	}
	return;
}
