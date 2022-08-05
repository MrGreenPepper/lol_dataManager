import * as tools from '../tools.js';
import { startBrowser } from './tools/browserControl.js';

export async function getAbilitiesData() {
	console.log('___________________________\n');
	console.log('abilityData scrapingn start\n');
	let championList = await tools.getChampionList();
	for (let championEntry of championList) {
		let championName = championEntry.championSaveName;

		let championData = await tools.loadJSONData(`./data/champions/${championName}_data.json`);
		championData = await scrapeAbilitiesData(championData, championEntry.abilityLink);
		//save the new data on a seperate spot
		tools.saveJSONData(championData, `./lol_scraper/data/champions/baseData/${championEntry.championSaveName}_abilities.json`);
		tools.saveJSONData(championData, `./data/champions/${championEntry.championSaveName}_data.json`);
		//final message
		console.log('abilitiesData saved: ', championData.name);
		console.info('\ncurrentChampion:\t', championEntry.championName);
		console.log('champion Index:\t', championEntry.index);
		console.log('scraping url:\t', championEntry.abilityLink);
	}
	console.log('abilityData scraping end\n');
	console.log('-------------------------\n');
}

async function scrapeAbilitiesData(championData, url) {
	const browser = await startBrowser();
	const page = await browser.newPage();

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

				champion.baseStats.windup = document.querySelectorAll('div[data-source="windup"]')[0].textContent.replace('Attack windup', '');

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
					let metaData = abilities[i].querySelectorAll('div.pi-item.pi-data.pi-item-spacing.pi-border-color');
					//			console.log('metaData List:', metaData);
					for (let metaNumber = 0; metaNumber < metaData.length; metaNumber++) {
						//			console.log('currentMeta:', metaData[metaNumber]);
						champion.abilities[i].metaData[metaNumber] = {};
						champion.abilities[i].metaData[metaNumber].text = metaData[metaNumber].innerText;
						//test if there is a specieal Leveling like per level

						try {
							let specialScaling = metaData[metaNumber].querySelectorAll('span.pp-tooltip.tooltips-init-complete');
							if (specialScaling.length > 0) {
								champion.abilities[i].metaData[metaNumber].specialScaling = {};
								for (let specialNumber = 0; specialNumber < specialScaling.length; specialNumber++) {
									let currentSpecialPart = specialScaling[specialNumber];
									let botValues;
									let botLabel;
									let topValues;
									let topLabel;
									let text = currentSpecialPart.innerText;
									try {
										botValues = currentSpecialPart.getAttribute('data-bot_values');
										console.log(botValues);
									} catch {
										//				console.log('no botV');
									}
									try {
										botLabel = currentSpecialPart.getAttribute('data-bot_label');
									} catch {
										//					console.log('no botL');
									}
									try {
										topValues = currentSpecialPart.getAttribute('data-top_values');
									} catch {}
									try {
										topLabel = currentSpecialPart.getAttribute('data-top_label');
									} catch {}
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber] = {};
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber].text = text;
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber].botLabel = botLabel;
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber].botValues = botValues;
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber].topValues = topValues;
									champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber].topLabel = topLabel;
									console.log(champion.abilities[i].metaData[metaNumber].specialScaling[specialNumber]);
								}
							}
						} catch (err) {
							console.error('special scaling error:', err);
						}
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
					//	console.log('textContainer: \t', textContainer);
					//first table is the headline text is in the second table --> all rows from there
					champion.abilities[i].textContent = {};

					//		console.log(textRowContainer);
					for (let textPart = 0; textPart < textContainer.length; textPart++) {
						//console.log('tableRow: ', tableRow);
						//   console.log('currentRow: \t', textContainer[textPart]);
						champion.abilities[i].textContent[textPart] = {};

						//console.log('textContainer: ', textContainer[textPart]);
						let text = textContainer[textPart].querySelector('div[style="vertical-align:top; padding: 0 0 0 7px;"]');
						//console.log('textPart:\t', textPart, 'content: ', text);
						//console.log('textPart:\t', textPart, 'content: ', text.innerHTML);
						champion.abilities[i].textContent[textPart].text = text.textContent;
						champion.abilities[i].textContent[textPart].html = text.innerHTML;

						//get the special scalings from the text
						try {
							let specialScaling = text.querySelectorAll('span.pp-tooltip.tooltips-init-complete');
							if (specialScaling.length > 0) {
								champion.abilities[i].textContent[textPart].specialScaling = {};
								for (let specialNumber = 0; specialNumber < specialScaling.length; specialNumber++) {
									let currentSpecialPart = specialScaling[specialNumber];
									console.log(currentSpecialPart);
									let botValues;
									let botLabel;
									let topValues;
									let topLabel;
									let text = currentSpecialPart.innerText;
									try {
										botValues = currentSpecialPart.getAttribute('data-bot_values');
										console.log(botValues);
									} catch {
										//			console.log('no botV');
									}
									try {
										botLabel = currentSpecialPart.getAttribute('data-bot_label');
									} catch {
										//			console.log('no botL');
									}
									try {
										topValues = currentSpecialPart.getAttribute('data-top_values');
									} catch {}
									try {
										topLabel = currentSpecialPart.getAttribute('data-top_label');
									} catch {}
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber] = {};
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber].text = text;
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber].botLabel = botLabel;
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber].botValues = botValues;
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber].topValues = topValues;
									champion.abilities[i].textContent[textPart].specialScaling[specialNumber].topLabel = topLabel;
									//	console.log(champion.abilities[i].textContent[textPart].specialScaling[specialNumber]);
								}
							}
						} catch (err) {
							console.error('special scaling error:', err);
						}
						//console.log(champion.abilities[i].textContent[tableRow].text);

						//request all skillTabs to this part of the text (= in this tableRow)
						let skillTabMarker = textContainer[textPart].querySelectorAll('dt');
						let skillTabContent = textContainer[textPart].querySelectorAll('dd');
						champion.abilities[i].textContent[textPart].skillTabs = {};
						for (let skillTabNumber = 0; skillTabNumber < skillTabMarker.length; skillTabNumber++) {
							// console.table(i, textPart, skillTabNumber);
							// console.log(skillTabMarker[skillTabNumber].innerText);
							// console.log(skillTabContent[skillTabNumber].innerText);
							champion.abilities[i].textContent[textPart].skillTabs[skillTabNumber] = {};
							champion.abilities[i].textContent[textPart].skillTabs[skillTabNumber].marker = skillTabMarker[skillTabNumber].innerText;
							champion.abilities[i].textContent[textPart].skillTabs[skillTabNumber].content = skillTabContent[skillTabNumber].innerText;
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

		//quick convert of the windup and asign to dataSet
		championRawData.baseStats.windup = championRawData.baseStats.windup.replaceAll('%', '');
		championRawData.baseStats.windup = championRawData.baseStats.windup.replaceAll(' ', '');
		championRawData.baseStats.windup = parseFloat(championRawData.baseStats.windup);
		championData.scraped_data.baseData.abilities = championRawData.abilities;
		championData.scraped_data.baseData.baseStats.windup = championRawData.baseStats.windup;
	} catch (err) {
		await tools.reportError(`scraping abilities failed`, championData.name, err.message, err.stack);

		console.log('champion failed: ', championData.name);
		console.error(err);
	}
	return championData;
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
				let links = Array.from(document.querySelectorAll('[data-champion] a'), (a) => a.getAttribute('href'));
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
		return element !== '/wiki/Kled_%26_Skaarl/LoL' && element !== null && element !== '/wiki/Mega_Gnar/LoL';
	});
	return championLinks;
}
