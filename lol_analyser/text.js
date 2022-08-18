import * as tools from '../tools.js';

const CHAMPIONSAVEPATH = './data/champions/';

export async function textToSkillTab() {
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;
		console.log(championName);
		let championData = await tools.loadJSONData(`${CHAMPIONSAVEPATH}${championName}_data.json`);

		let championAbilities = championData.analysed_data.baseData.abilities;
		try {
			let structureRegexs = createStructureRegexs(championData);
			championAbilities = await identifyStructure(championAbilities, structureRegexs);
		} catch (err) {
			console.log(err);
		}

		await tools.saveJSONData(championData, `./data/champions/${championName}_data.json`);
		await tools.saveJSONData(championData, `./lol_analyser/data/champions/${championName}_data.json`);
	}
}

function identifyStructure(championAbilities) {
	/**identifies the structure of the text and marks the parts as trigger, what is empowered, with which value and what type is the emporement*/
	for (let i = 0; i < 5; i++) {
		let currentAbility = championAbilities[i];
		let textContentKeys = Object.keys(currentAbility.textContent);
		for (let contentKey of textContentKeys) {
			let currentTextContent = currentAbility.textContent[contentKey];
		}
	}
}

function createStructureRegexs(championData) {
	let championName = championData.name;
	let tester = [`${championName}`];
	let structureRegexs = [];
	/**champion emporments */
	structureRegexs.push(`${championName}.{0,6}gains`);
	structureRegexs.push(`${championName}.{0,6}is empowered`);
	structureRegexs.push(`${championName}`);
	structureRegexs.push(`${championName}`);
	structureRegexs.push(`${championName}`);
	structureRegexs.push(`${championName}`);
	tester = tester.map((regexString) => new RegExp(regexString, 'gim'));
	structureRegexs = structureRegexs.map((regexString) => new RegExp(regexString, 'gim'));

	return structureRegexs;
}
