async function copyObjectByValue(object) {
	let copiedObject = {};

	objectKeys = Object.keys(object);

	objectKeys.map((key) => {
		switch (testType(object[key])) {
			case 'string':
				copiedObject[key] = object[key];
				break;
			case 'array':
				copiedObject[key] = { ...object[key] };
				break;
			case 'object':
				copyObjectByValue(object[key]).then((value) => (copiedObject[key] = value));
				break;
		}
	});

	return copiedObject;
}

function testType(objectKey) {
	if (typeof objectKey !== 'object') {
		return 'string';
	}
	if (Array.isArray(objectKey)) {
		return 'array';
	}
	if (typeof (typeof objectKey === 'object' && objectKey != null)) {
		return 'object';
	}
}

module.exports = { copyObjectByValue };
