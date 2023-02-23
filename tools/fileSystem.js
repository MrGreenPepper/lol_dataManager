import fs from 'fs';

export async function saveJSONData(data, url) {
	await fs.writeFileSync(url, JSON.stringify(data), 'utf-8');
	return;
}

export async function saveCSVData(data, url) {
	let dataCSVString = '';

	//	let header = data[0].reduce((current, past) => past + ',' + current);
	//	dataCSVString += header + '\n';
	for (let rowNumber = 0; rowNumber < data.length; rowNumber++) {
		let currentRow = data[rowNumber];
		dataCSVString += currentRow.reduce((current, past) => current + ',' + past);
		dataCSVString += '\n';
	}
	await fs.writeFileSync(url, dataCSVString, 'utf-8');
	return;
}

export async function loadJSONData(url) {
	url = decodeURIComponent(url);
	let data = await fs.readFileSync(url, 'utf-8');
	return JSON.parse(data);
}

export async function loadCSVData(url) {
	let csvData = [];
	let csvDataString = fs.readFileSync(url, 'utf-8');
	let rows = csvDataString.split('\n');
	for (let i = 0; i < rows.length; i++) {
		csvData.push(rows[i].split(','));
	}
	csvData = csvData.filter((currentElement) => !currentElement[0] == '');
	return csvData;
}

/**Resets the current data with data from a backup
 * @param {string} entryPoint [lol_scraper, lol_extractor, lol_analyser, lol_calculator] - the entry point of the data
 * @param {string} category [champions, items] - the category of the data
 */
