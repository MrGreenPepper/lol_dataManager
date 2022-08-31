export function getSpecialContentPosition(currentTextContent) {
	/**gets the position of all concerning marked passage of the specialScalingContent */
	let markedPositions = [];
	let limiterTypes = [];

	for (let specialTab of currentTextContent.specialScalingContent.tabs) {
		limiterTypes.push(specialTab.limiterType);
	}

	limiterTypes.forEach((limiterType) => {
		let position = -1;
		let limiterArray = limiterType.split(' ');
		let limiterRegex = limiterArray.reduce((regex, word) => {
			return (regex += '(' + word + ').*?');
		}, '');
		limiterRegex = new RegExp(limiterRegex, 'gim');

		currentTextContent.markedPassages.forEach((passage, index) => {
			if (limiterRegex.test(passage[0])) position = index;
		});
		if (position != -1) markedPositions.push([position, limiterType]);
		else {
			console.log('cant find position of \t', limiterType);
		}
	});
	return markedPositions;
}
