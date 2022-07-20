import * as markerTools from './marker/markerTools.js';
import * as tools from '../tools.js';

export async function cleanAbilities() {
	let championList = await tools.getChampionList();
	for (let championName of championList) {
		console.log(championName);
		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		/** delete unnecessary Markers, rest of the markers are set to lower case and grouped to ability.skillTabs
		 * and cleaned from unnecessary words like "champion"*/
		let championAbilities = championData.analysed_data.baseData.abilities;
		try {
			championAbilities = await markerTools.markToIgnoreSkillTabMarkers(championAbilities);

			championAbilities.skillTabs = await tools.applyToAllSkillTabs(
				championAbilities.skillTabs,
				deleteIgnores
			);
		} catch (err) {
			console.log('\ncleanAbilities()	- mark&delete skillTabMarkers \t', championName);
			tools.reportError(
				'cleanAbilities()	- mark&delete skillTabMarkers',
				championName,
				err.message,
				err.stack
			);
		}

		try {
			championAbilities.skillTabs = await markerTools.cleanMarkers(
				championAbilities.skillTabs
			);
		} catch (err) {
			con;
		}
		// championAbilities.skillTabs = await markerTools.applyToAllSkillTabs(
		//   championAbilities.skillTabs,
		//   markerTools.numbersToFloat
		// );
		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
	}
}

async function deleteIgnores(skillTabArray) {
	for (let i = 0; i < skillTabArray.length; i++) {
		let currentArray = skillTabArray[i];
		currentArray = currentArray.filter((currentSkillTab) => {
			async function applyToAllSkillTabs(skillTabs, applyFunction) {
				/** applies a function to every single skillTab
				 *
				 * @param {object} skillTabs - kind of array out of skillTabs in form of an object
				 * @param {function} applyFunction - function which is applied to every single skillTab
				 *
				 * @returns {object} skillTabs - modified skillTabsArray
				 */
				let abilityKeys = Object.keys(skillTabs);
				try {
					for (var i of abilityKeys) {
						let currentAbility = skillTabs[i];
						for (let n = 0; n < currentAbility.length; n++) {
							let currentContent = currentAbility[n];
							for (let c = 0; c < currentContent.length; c++) {
								skillTabs[i][n][c] = await applyFunction(currentContent[c]);
							}
						}
					}
				} catch (err) {
					console.log(err);
					console.log(skillTabs);
				}
				return skillTabs;
			}
			let testValue = /ignore this/gi.test(currentSkillTab.marker);
			return !testValue;
		});
		skillTabArray[i] = currentArray;
	}
	return skillTabArray;
}
