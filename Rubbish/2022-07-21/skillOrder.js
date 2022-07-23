export async function extractSkillOrder(championData) {
	let qOrder = championData.abilities.skillsOrder.slice(0, 18);
	let wOrder = championData.abilities.skillsOrder.slice(18, 36);
	let eOrder = championData.abilities.skillsOrder.slice(36, 54);
	let rOrder = championData.abilities.skillsOrder.slice(54, 72);
	let skillOrder = [];
	for (let i = 0; i < 18; i++) {
		if (qOrder[i] != '') {
			skillOrder.push('Q');
		}
		if (wOrder[i] != '') {
			skillOrder.push('W');
		}
		if (eOrder[i] != '') {
			skillOrder.push('E');
		}
		if (rOrder[i] != '') {
			skillOrder.push('R');
		}
	}
	championData.abilities.skillsOrder = skillOrder;
	return championData;
}
