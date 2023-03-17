/**generates the metaDataIdentifier
 * @param {integer} uniqueKey - most likely the order number of the concerning metaData property
 *
 * @returns {string} metaDataIdentifier
 */
export function generateMetaDataDescription(uniqueKey) {
	let metaDataIdentifier = 'metaDataProperty' + uniqueKey;
	return metaDataIdentifier;
}

/** generates a unique identifier for each skillTab
 * @param {integer} textContentPart
 * @param {integer} skillTabNumber
 *
 * @return {string} skillTabIdentifier
 */
export function generateSkillTabIdentifier(skillTabNumber) {
	let skillTabIdentifier;
	skillTabIdentifier = 'skillTabProperty' + skillTabNumber;

	return skillTabIdentifier;
}

export function generateAbilityDescription(abilityNumber) {
	let abilityIdentifier;
	try {
		abilityNumber = parseInt(abilityNumber);
	} catch {}
	if (abilityNumber == 0) {
		abilityIdentifier = 'passive';
	} else {
		abilityIdentifier = 'ability' + abilityNumber;
	}

	return abilityIdentifier;
}

/** generates part descriptions for the text content data
 * @param {integer} textContentPart
 * @returns {string} textContentPartIdentifier
 */
export function generateTextContentPartDescription(textContentPart) {
	try {
		textContentPart = parseInt(textContentPart);
	} catch {}
	let textContentPartIdentifier = 'textPart' + textContentPart;
	return textContentPartIdentifier;
}

export function generateSkillPropertyDescription(skillPropertyNumber) {
	try {
		skillPropertyNumber = parseInt(skillPropertyNumber);
	} catch {}
	let skillPropertyDescription = 'skillProperty' + skillPropertyNumber;
	return skillPropertyDescription;
}
