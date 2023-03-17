import * as tools from '../tools/tools.js';
import * as naming from '../tools/naming.js';

/**while scraping many datapoints are just arrays or objectives with numbers, if they are nested its difficult to get identify the meaning of the
 * dataPoint, thus we generate a selfdescribing data structure by using an object and the keyNames as short descriptions
 *
 * only works correctly after the scraping procedure
 */
export async function createSelfDescribingDataStructure() {
	console.log('___________________________\n');
	console.log('abilityData scraping start\n');
	let championList = await tools.looping.getChampionList();
	for (let championEntry of championList) {
		console.info('\ngenerate basic selfdescribing datastructur for \t', championEntry.inGameName);
		console.log('champion Index:\t\t', championEntry.index);

		let championData = await tools.fileSystem.loadJSONData(`./data/champions/${championEntry.fileSystemName}`);
		transformDataStructure(championData);

		let savePath = `./data/champions/${championEntry.fileSystemName}`;
		await tools.fileSystem.saveJSONData(championData, savePath);
		//final message
		console.log('--> \tabilitiesData saved: \t', savePath);
	}
	console.log('abilityData scraping end\n');
	console.log('-------------------------\n');
}
//DD ME 102 skoda mit werbeaufschrift das muss nicht sein
function transformDataStructure(championData) {
	transformAbilityDataStructure(championData);
	transformMetaDataStructure(championData);
	transformTextContentStructure(championData);
	transformSkillTabStructure(championData);
	return;
}

function transformAbilityDataStructure(championData) {
	let scrapedData = championData.scraped_data;
	let abilityData = scrapedData.abilities;
	let abilityKeys = Object.keys(abilityData);

	for (let oldAbilityKey of abilityKeys) {
		let abilityDescription = naming.generateAbilityDescription(oldAbilityKey);
		abilityData[abilityDescription] = abilityData[oldAbilityKey];
		delete abilityData[oldAbilityKey];
	}
	return;
}
function transformMetaDataStructure(championData) {
	let scrapedData = championData.scraped_data;
	let abilityData = scrapedData.abilities;
	let abilityKeys = Object.keys(abilityData);

	for (let currentAbilityKey of abilityKeys) {
		let currentAbilityData = abilityData[currentAbilityKey];
		let metaDataKeys = Object.keys(currentAbilityData.metaData);
		for (let oldMetaKey of metaDataKeys) {
			let metaDataDescription = naming.generateMetaDataDescription(oldMetaKey);
			currentAbilityData.metaData[metaDataDescription] = currentAbilityData.metaData[oldMetaKey];
			delete currentAbilityData.metaData[oldMetaKey];
		}
	}
	return;
}
function transformTextContentStructure(championData) {
	let scrapedData = championData.scraped_data;
	let abilityData = scrapedData.abilities;
	let abilityKeys = Object.keys(abilityData);

	for (let currentAbilityKey of abilityKeys) {
		let currentAbilityData = abilityData[currentAbilityKey];
		let textContentKeys = Object.keys(currentAbilityData.textContent);
		for (let oldPartDescription of textContentKeys) {
			let textContentDescription = naming.generateTextContentPartDescription(oldPartDescription);
			currentAbilityData.textContent[textContentDescription] = currentAbilityData.textContent[oldPartDescription];
			delete currentAbilityData.textContent[oldPartDescription];
		}
	}
	return;
}

function transformSkillTabStructure(championData) {
	let scrapedData = championData.scraped_data;
	let abilityData = scrapedData.abilities;
	let abilityKeys = Object.keys(abilityData);

	for (let currentAbilityKey of abilityKeys) {
		let currentAbility = abilityData[currentAbilityKey];
		let textContentKeys = Object.keys(currentAbility.textContent);

		for (let [textContentNumber, currentTextPartKey] of textContentKeys.entries()) {
			let currentTextPart = currentAbility.textContent[currentTextPartKey];
			let skillTabKeys = Object.keys(currentTextPart.skillTabs);

			for (let skillTabKey of skillTabKeys) {
				let skillTabDescription = naming.generateSkillTabIdentifier(skillTabKey);
				currentTextPart.skillTabs[skillTabDescription] = currentTextPart.skillTabs[skillTabKey];
				delete currentTextPart.skillTabs[skillTabKey];
			}
		}
	}
	return;
}
