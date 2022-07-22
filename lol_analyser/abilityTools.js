export async function copyObjectByValue(object) {
	let copiedObject = JSON.parse(JSON.stringify(object));

	return copiedObject;
}
