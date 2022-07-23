import * as cleaner from './cleaner.js';

export function firstSeperation_isItMath(sign) {
	switch (sign) {
		case '/':
			return true;
			break;
		case '%':
			return true;
			break;
		case ' ':
			return true;
			break;
		case '+':
			return true;
			break;
		case '"':
			return true;
			break;
		case ':':
			return true;
			break;
		case '-':
			return true;
			break;
		case '−':
			return true;
			break;
		case '»':
			return true;
			break;
		case '(':
			return true;
			break;
		case ')':
			return true;
			break;
		case '.':
			return true;
			break;
		default:
			if (isNaN(sign) == false) return true;
			return false;
	}
}

export function isItMath(sign) {
	switch (sign) {
		case '/':
			return true;
			break;
		//testing this out to get the % into the text parts in skillTabs, but didnt test it for other parts
		case '%':
			return false;
			break;
		case ' ':
			return true;
			break;
		case '+':
			return true;
			break;
		case '"':
			return true;
			break;
		case ':':
			return true;
			break;
		case '-':
			return true;
			break;
		case '−':
			return true;
			break;
		case '»':
			return true;
			break;
		case '(':
			return false;
			break;
		case ')':
			return false;
			break;
		case '.':
			return true;
			break;
		default:
			if (isNaN(sign) == false) return true;
			return false;
	}
}

export function cleanMath(cleanMathContent) {
	cleanMathContent = cleanMathContent.replace(/\//g, '');
	cleanMathContent = cleanMathContent.replace(/:/g, '');

	cleanMathContent = cleanMathContent.replace(/«/g, '');
	cleanMathContent = cleanMathContent.replace(/»/g, '');

	cleanMathContent = cleanMathContent.trim();
	//next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
	cleanMathContent = cleanMathContent.replace(/ /g, '');
	cleanMathContent = cleanMathContent.replace(/ /g, '');
	return cleanMathContent;
}

export async function divideText() {
	//1.1 get the data from db and  1.2 divide Text into meaningful parts
	//1.1 get the data from db
	//--> TODO: get it into the shape ... getting 1 Text part and divide this into markers and math
	let markers_meta = [
		'range',
		'cooldown',
		'speed',
		'cast time',
		'effect radius',
		'cost', //TODO: mana/energy etc. need an extra math category
		'width',
	];
	let markers_text = ['movement', 'dash', 'teleport', 'snared', 'stunned', 'knocked up', 'reset'];
	//TODO: resets ..... basic attack /cooldown
	let markers_skilltab = [
		'basic attack',
		'true damage',
		'physical damage',
		'magic damage',
		'heal',
		'shield',
	];
	markers = [];
	markers.push(...markers_meta, ...markers_skilltab, ...markers_text);

	//get the raw champion data
	let sql_syntax = `SELECT * FROM lol_scraper.rawData_${championName}`;
	dbControl.dbquery(sql_syntax, false).then((rawText) => {
		//console.log(rawText);

		let rawData = rawText[0];
		//aim for championData = {"name", "specials", "abilities": #:{}}
		let championData = { name: championName, specials: '', abilities: {} };

		//1.2 divide Text into meaningful parts
		let rawDataKeys = Object.keys(rawData);
		// check if there is an active and a passive part in the ability
		let abilityTextKeys = rawDataKeys.filter((element) => element.indexOf('_textContent') > -1);

		for (let i = 0; i < abilityTextKeys.length; i++) {
			let markers_active = [];
			let abilityNameKey = 'ability' + i + '_name';
			championData.abilities[i] = {};
			championData.abilities[i].name = rawData[abilityNameKey];
			let currentAbilityText = rawData[abilityTextKeys[i]];
			// cut the name
			currentAbilityText = currentAbilityText.slice(championData.abilities[i].name.length);
			//console.log(currentAbilityText);

			markers_active.push(
				getActiveMarkers(markers_meta.slice(0), currentAbilityText, 'meta')
			);
			markers_active.push(
				getActiveMarkers(markers_text.slice(0), currentAbilityText, 'text')
			);
			markers_active.push(
				getActiveMarkers(markers_skilltab.slice(0), currentAbilityText, 'skilltabs')
			);

			championData.abilities[i].markers = markers;

			championData.abilities[i].markers_active = markers_active;

			championData.abilities[i].textContent = currentAbilityText;
		}
		console.log(championData);
	});
}

export async function loopToTheLast(multiArray, targetFunction) {
	if (typeof multiArray === 'object' && multiArray !== null) {
		let objKeys = Object.keys(multiArray);
		for (let o = 0; o < objKeys.length; o++) {
			multiArray[objKeys[o]] = await loopToTheLast(multiArray[objKeys[o]], targetFunction);
		}
	}

	if (typeof multiArray === 'string' || multiArray instanceof String) {
		return cleaner.cleanString(multiArray);
	} else {
		return multiArray;
	}
}
