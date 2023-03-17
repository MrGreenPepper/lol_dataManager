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
