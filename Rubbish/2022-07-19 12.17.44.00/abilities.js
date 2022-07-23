import * as tools from '../tools.js';
import { startBrowser } from './tools/browserControl.js';
let url_baseStats = 'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';

export async function getAbilitiesData() {
	// old:	let links = await getChampionLinks();

	let savePathBase = './lol_scraper/data/championData/';
	let savePath;
	let championList = await tools.getChampionList();

	for (let i = 0; i < championList.length; i++) {
		let championData = await tools.loadJSONData(
			`./lol_scraper/data/championData/${championList[i]}_data.json`
		);

		await scrapeAbilitiesData(championData);
	}
}
async function scrapeAbilitiesData(championData) {
	console.info('currentChampion: \t', championData.name);
	let baseUrl = 'https://leagueoflegends.fandom.com/wiki/';
	let championName = championData.name;
	let url = `${baseUrl}${championName}/LoL`;

	const browser = await startBrowser();
	const page = await browser.newPage();

	console.log('scraping url: ', url);
	try {
		//connects to every ChampionSite and scrapes selected raw Data
		await page.goto(url);
		await page.waitForSelector('div.main-container');
		let championRawData = await page.evaluate(() => {
			try {
				let champion = {};

				champion.name = document.querySelector('h1.page-header__title').textContent;
				champion.baseStats = {};
				champion.abilities = {};

				champion.baseStats.windup = document
					.querySelectorAll('div[data-source="windup"]')[0]
					.textContent.replace('Attack windup', '');

				let abilities = document.querySelectorAll('div.ability-info-container');

				console.log('origin: ', abilities);

				//ability number 0 should be always the passive
				for (let i = 0; i < abilities.length; i++) {
					champion.abilities[i] = {};
					let nameTag = abilities[i].querySelector('span.mw-headline');
					champion.abilities[i].name = nameTag.getAttribute('id');
					console.log('name: ', champion.abilities[i].name);

					//seperate the meta data
					champion.abilities[i].metaData = {};
					let metaData = abilities[i].querySelectorAll(
						'div.pi-item.pi-data.pi-item-spacing.pi-border-color'
					);
					//console.log('m:', metaData);
					for (m in metaData) {
						champion.abilities[i].metaData[m] = metaData[m].innerText;
					}
					//	console.log('full metaData: ', champion.abilities[i].metaData);

					//most of the pure math (dmg & healing stats) are in the skill-tabs,
					//thus we scrape them into an extra variable to analyse them later
					/**champion.abilities[i].skillTabs = {};
				 * 
        let skillTabsRaw = abilities[i].querySelectorAll('dl.skill-tabs');
        console.log('originSkillTabs: ', skillTabsRaw);
        for (n in skillTabsRaw) {
          champion.abilities[i].skillTabs[n] = skillTabsRaw[n].textContent;
        }*/

					// textContant parted with there skilltabs now
					let textContainer = abilities[i].querySelectorAll(
						'div[style="grid-column-end: span 2;"], div[style="grid-column-end: span 2; display:contents"]'
					);
					// console.log('textContainer: \t', textContainer);
					//first table is the headline text is in the second table --> all rows from there
					champion.abilities[i].textContent = {};
					//		console.log(textRowContainer);
					for (let textPart = 0; textPart < textContainer.length; textPart++) {
						//console.log('tableRow: ', tableRow);
						//   console.log('currentRow: \t', textContainer[textPart]);
						champion.abilities[i].textContent[textPart] = {};

						let text = textContainer[textPart].querySelector(
							'div[style="vertical-align:top; padding: 0 0 0 7px;"]'
						);
						//   console.log(text);
						champion.abilities[i].textContent[textPart].text = text.textContent;
						//console.log(champion.abilities[i].textContent[tableRow].text);

						//request all skillTabs to this part of the text (= in this tableRow)
						let skillTabMarker = textContainer[textPart].querySelectorAll('dt');
						let skillTabContent = textContainer[textPart].querySelectorAll('dd');
						champion.abilities[i].textContent[textPart].skillTabs = {};
						for (
							let skillTabNumber = 0;
							skillTabNumber < skillTabMarker.length;
							skillTabNumber++
						) {
							// console.table(i, textPart, skillTabNumber);
							// console.log(skillTabMarker[skillTabNumber].innerText);
							// console.log(skillTabContent[skillTabNumber].innerText);
							champion.abilities[i].textContent[textPart].skillTabs[skillTabNumber] =
								{};
							champion.abilities[i].textContent[textPart].skillTabs[
								skillTabNumber
							].marker = skillTabMarker[skillTabNumber].innerText;
							champion.abilities[i].textContent[textPart].skillTabs[
								skillTabNumber
							].content = skillTabContent[skillTabNumber].innerText;
						}
					}
					// console.log(champion.abilities[i].textContent);

					//checking the type of the ability
					//passive and/or active skill --> creating the parts for it
				}

				//console.log(abilities.getElementByID("id"));
				//alert(abilities);
				return champion;
			} catch (err) {
				throw err;
			}
		});
		await browser.close();
		let inGameData = {};

		inGameData.scraped_data.baseData.abilities = championRawData.abilities;
		inGameData.scraped_data.baseData.baseStats.windup = championRawData.baseStats.windup;
		//assign the data to the existing one

		tools.saveJSONData(
			inGameData,
			`./lol_scraper/data/champion_baseData/${championData.name}_data.json`
		);
		console.log('championData saved: ', championData.name);
	} catch (err) {
		await tools.reportError(`scraping abilities failed`, championData.name, err.message);

		console.warn('champion failed: ', championData.name);
		console.error(err);
	}
}

async function getChampionLinks() {
	let url_baseStats = 'https://leagueoflegends.fandom.com/wiki/List_of_champions/Base_statistics';
	const championList = await tools.loadJSONData('./lol_scraper/data/championList.json');

	const firstLink = `/wiki/${championList[0]}/LoL`;
	const lastLink = `/wiki/${championList[championList.length - 1]}/LoL`;

	const browser = await startBrowser();
	const page = await browser.newPage();

	await page.goto(url_baseStats);

	let championLinks = await page.evaluate(
		(firstLink, lastLink) => {
			try {
				let links = Array.from(document.querySelectorAll('[data-champion] a'), (a) =>
					a.getAttribute('href')
				);
				console.log(links);
				links = links.slice(links.indexOf(firstLink), links.indexOf(lastLink) + 2);

				return links;
			} catch (err) {
				throw err;
			}
		},
		firstLink,
		lastLink
	);

	//let findDuplicates = (championLinks) => championLinks.filter((item, index) => championLinks.indexOf(item) != index);
	// delete duplicates
	let seen = {};
	championLinks = championLinks.filter((item) => {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});

	championLinks.sort();

	//delete  fail entry Kled & Skaarl and all empty ones
	championLinks = championLinks.filter((element) => {
		return (
			element !== '/wiki/Kled_%26_Skaarl/LoL' &&
			element !== null &&
			element !== '/wiki/Mega_Gnar/LoL'
		);
	});
	return championLinks;
}
