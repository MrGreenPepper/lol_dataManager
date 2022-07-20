async function numbersToFloat(skillTab) {
	/** transforms all numbers in strings to actual floatNumbers */
	//first all flatValues
	try {
		skillTab.math.flatPart = skillTab.math.flatPart.map((currentNumber) => {
			return parseFloat(currentNumber);
		});
	} catch (err) {
		console.log('%cno flatPart for parseFloat', 'color: grey');
	}
	try {
		//second all scalingValues

		//check for multiScaling
		for (let i = 0; i < skillTab.math.scalingPart.length; i++) {
			let currentScalingPart = skillTab.math.scalingPart[i];

			if (Array.isArray(currentScalingPart[1])) {
				currentScalingPart = currentScalingPart.map((currentScalingPart) => {
					currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
						return parseFloat(currentNumber);
					});
				});
			} else {
				currentScalingPart[0] = currentScalingPart[0].map((currentNumber) => {
					return parseFloat(currentNumber);
				});
			}
		}
	} catch (err) {
		console.log('%cno scalingPart for parseFloat', 'color: grey');
	}
	return skillTab;
}

export function getActiveMarkers(currentMarker, text, type) {
	let testIntervalls = [];
	for (let n = 0; n < currentMarker.length; n++) {
		let position = text.toLowerCase().indexOf(currentMarker[n]);
		if (position > -1) currentMarker[n] = [currentMarker[n], true, position];
		else currentMarker[n] = [currentMarker[n], false, -1];

		// sort the currentMarker by there apperance to slide the text later
		currentMarker.sort((a, b) => {
			if (a[2] > b[2]) return 1;
			if (a[2] < b[2]) return -1;
			return 0;
		});

		let activeMarkers = currentMarker.filter((element) => {
			return element[1];
		});

		// get the possible maximum length for the  intervalls to check them later
		for (i = 0; i < activeMarkers.length; i++) {
			// for the last marker the maximum end is equal to the end of the text
			if (i + 1 == activeMarkers.length) {
				testIntervalls[i] = [];
				testIntervalls[i][0] = activeMarkers[i][2];
				testIntervalls[i][1] = text.length;
			} else {
				testIntervalls[i] = [];
				testIntervalls[i][0] = activeMarkers[i][2];
				testIntervalls[i][1] = activeMarkers[i + 1][2];
			}
		}
		//check the intervalls
		for (i = 0; i < testIntervalls.length; i++) {
			let lastNumberIndex = 0;
			let testText = text.slice(testIntervalls[i][0], testIntervalls[i][1]);
			//prepare the testText
			testText = testText.toLowerCase();
			testText.replace(activeMarkers[i][1], '');
			testText = testText.replace(/a, b, n/g, '');

			// at the first num jump into the "math sign mode" until a char appears then return the index of the last number
			console.log('origin testText: ', testText);
			/*let slicepoint = 1;
		for (let n = 0; n < testText.length; n++) {
			if (!markers_isItMath(testText.charAt(n))) 
                {testText = testText.slice(slicepoint);}
                else {
                	slicepoint++;
                }

		}*/
			activeMarkers[(i, 3)] = testText;
		}
		return activeMarkers;
	}
}
