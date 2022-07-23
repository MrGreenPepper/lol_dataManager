import * as extractorTools from './extractorTools.js';

export function markers_clean_skilltab(text) {
	text = text.replace(/a/g, '');
	text = text.replace(/b/g, '');
	text = text.replace(/c/g, '');
	text = text.replace(/d/g, '');
	text = text.replace(/e/g, '');
	text = text.replace(/f/g, '');
	text = text.replace(/g/g, '');
	text = text.replace(/h/g, '');
	text = text.replace(/i/g, '');
	text = text.replace(/j/g, '');
	text = text.replace(/k/g, '');
	text = text.replace(/l/g, '');
	text = text.replace(/m/g, '');
	text = text.replace(/n/g, '');
	text = text.replace(/o/g, '');
	text = text.replace(/p/g, '');
	text = text.replace(/q/g, '');
	text = text.replace(/r/g, '');
	text = text.replace(/s/g, '');
	text = text.replace(/t/g, '');
	text = text.replace(/u/g, '');
	text = text.replace(/v/g, '');
	text = text.replace(/w/g, '');
	text = text.replace(/x/g, '');
	text = text.replace(/y/g, '');
	text = text.replace(/z/g, '');
	text = text.replace(/:/g, '');
	text = text.replace(/ /g, '');
	//text.replace(//g,'');
}
export function firstClean(text) {
	text = text.replace(/\«/g, '');
	text = text.replace(/\»/g, '');
	text = text.replace(/\(/g, '');
	text = text.replace(/\)/g, '');
	text = text.replace(/\:/g, '');
	text = text.trim();
	return text;
}
export function cleanText(text) {
	text = text.replace(/\«/g, '');
	text = text.replace(/\»/g, '');
	text = text.replace(/\(/g, '');
	text = text.replace(/\)/g, '');
	text = text.trim();
	return text;
}

export function cleanString(math) {
	return new Promise((resolve) => {
		if (math.length > 0) {
			math = math.trim();
			math = math.replace(':', '');
			math = math.replace('«', '');
			math = math.replace('»', '');

			return resolve(math);
		} else {
			return resolve(math);
		}
	});
}

export async function cleanEmptyTextContent(currentAbility) {
	let textContentKeys = Object.keys(currentAbility.textContent);

	for (let tK of textContentKeys) {
		let keys = Object.keys(currentAbility.textContent[tK]);
		if (keys.length == 0) {
			delete currentAbility.textContent[tK];
		}
	}

	return currentAbility;
}

export async function cleanMathContent(skillTabMath) {
	await extractorTools.loopToTheLast(skillTabMath, cleanString);
	return skillTabMath;
}
