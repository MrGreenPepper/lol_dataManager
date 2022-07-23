import * as tools from '../tools.js';
import * as browserControl from './tools/browserControl.js';

export async function getInGameData() {
	//TODO: Cassiopeia has no boots, aphelios no R, khazix, viego, viktor and kaisa missing too
	// duno if this are all failures --> test
	//
	//

	console.log('_________________________\n');
	console.log('scraping inGameData start\n');
	let championList = await tools.getChampionLinkList();

	for (let champEntry of championList) {
		let url = champEntry.inGameLink;
		let championName = champEntry.championName;
		try {
			//let url = baseUrl + 'amumu';
			console.log('scraping url: ', url);
			const browser = await browserControl.startBrowser();
			const page = await browser.newPage();
			//connects to every ChampionSite and scrapes selected raw Data
			await page.goto(url);
			await page.waitForSelector('div#filters-menu');

			let championRawData = await page.evaluate(() => {
				let champion = {};
				champion.abilities = {};
				champion.abilities.skillOrder = {};
				champion.items = {};
				champion.masteries = {};

				//Skill-Order:
				let skillOrderRaw = document.querySelectorAll('td.skillCell');
				console.log('skillOrder:', skillOrderRaw);
				let skillOrder = [];
				for (let i = 0; i < skillOrderRaw.length; i++) {
					skillOrder[i] = skillOrderRaw[i].innerText;
				}
				champion.abilities.skillOrder = skillOrder;

				//Items:
				let startItems = [];
				let smallItems = document.querySelectorAll('div.medium-11.columns');
				let items_start = smallItems[0].querySelectorAll('div.championSpell');
				for (let i = 0; i < items_start.length; i++) {
					startItems[i] = items_start[i].querySelector('img').getAttribute('alt');
				}
				champion.items.start = {};
				champion.items.start = startItems;

				//here try only for cassio :_)
				try {
					let boots = smallItems[1].querySelector('img').getAttribute('alt');
					champion.items.boots = boots;
				} catch {}
				let coreItems = [];
				let bigItems = document.querySelectorAll('div.medium-13.columns');
				let items_core = bigItems[0].querySelectorAll('div.championSpell');
				for (let i = 0; i < items_core.length; i++) {
					coreItems[i] = items_core[i].querySelector('img').getAttribute('alt');
				}
				let firstBackItem = coreItems.splice(0, 1);
				champion.items.core = coreItems;
				champion.items.firstBackItem = firstBackItem;

				let endItems = [];
				let items_finish = bigItems[1].querySelectorAll('div.championSpell');
				for (let i = 0; i < items_finish.length; i++) {
					endItems[i] = items_finish[i].querySelector('img').getAttribute('alt');
				}
				champion.items.end = endItems;

				//Masteries:
				let masteries_container = document.querySelectorAll(
					'div.box.box-padding-10.overviewBox'
				);

				//choose the right container for masteries
				for (let i = 0; i < masteries_container.length; i++) {
					try {
						testElement =
							masteries_container[i].querySelector('h3.box-title').innerText;
						if (testElement == 'Runes') masteries_container = masteries_container[i];
					} catch {}
				}

				let masteries_mainRaw = masteries_container.querySelectorAll('th');
				let masteries_main = [];
				masteries_main[0] = masteries_mainRaw[0].querySelector('img').getAttribute('src');
				masteries_main[0] = masteries_main[0].replace(
					'//lolg-cdn.porofessor.gg/img/perks/11.4/64/',
					''
				);
				masteries_main[0] = masteries_main[0].replace('.png', '');
				masteries_main[1] = masteries_mainRaw[1].querySelector('img').getAttribute('src');
				masteries_main[1] = masteries_main[1].replace(
					'//lolg-cdn.porofessor.gg/img/perks/11.4/64/',
					''
				);
				masteries_main[1] = masteries_main[1].replace('.png', '');
				champion.masteries.main = masteries_main;

				//small mastery points:
				//0-11 small masteries from main
				//12 - 17 small masteries from second
				//18 - 19 extra runes
				let smallMasteries_container = masteries_container.querySelectorAll('td');
				let smallMasteries = [];
				for (let i = 0; i < smallMasteries_container.length; i++) {
					let masteryPointName = smallMasteries_container[i]
						.querySelector('img')
						.getAttribute('alt');
					console.log(masteryPointName);
					//if there is a div with style modifier the opacity is lowered --> mastery point is inactiv
					let statusChecker = smallMasteries_container[i].querySelector(
						'div[style="opacity: 0.2;"]'
					);
					let status = false;
					if (statusChecker == null) status = true;
					console.log(status);
					let couple = [masteryPointName, status];
					smallMasteries[i] = couple;
				}
				champion.masteries.smallMasteries = smallMasteries;

				//Summoner Spells:
				let summonerSpells_container = document.querySelectorAll(
					'div.box.box-padding-10.overviewBox'
				);

				for (let i = 0; i < summonerSpells_container.length; i++) {
					try {
						testElement =
							summonerSpells_container[i].querySelector('h3.box-title').innerText;
						if (testElement == 'Summoner Spells')
							summonerSpells_container = summonerSpells_container[i];
					} catch {}
				}

				let summonerSpells = [];
				let summonerSpellsRaw = summonerSpells_container.querySelectorAll('img');
				summonerSpells[0] = summonerSpellsRaw[0].getAttribute('alt');
				summonerSpells[1] = summonerSpellsRaw[1].getAttribute('alt');
				champion.summonerSpells = summonerSpells;

				console.log(champion);

				return champion;
			});

			await browser.close();

			let newData = {};
			newData.scraped_data = {};
			newData.scraped_data.inGameData = {};

			newData.scraped_data.inGameData.items = championRawData.items;
			newData.scraped_data.inGameData.masteries = championRawData.masteries;
			newData.scraped_data.inGameData.skillOrder = championRawData.abilities.skillOrder;
			newData.scraped_data.inGameData.summonerSpells = championRawData.summonerSpells;

			await tools.saveJSONData(
				newData,
				`./lol_scraper/data/champions/inGameData/${newData.name}_data.json`
			);

			let oldData = await tools.loadJSONData(
				`./data/champions/${champEntry.championSaveName}_data.json`
			);
			oldData.scraped_data.inGameData.items = championRawData.items;

			oldData.scraped_data.inGameData.masteries = championRawData.masteries;
			oldData.scraped_data.inGameData.skillOrder = championRawData.abilities.skillOrder;
			oldData.scraped_data.inGameData.summonerSpells = championRawData.summonerSpells;
			await tools.saveJSONData(
				oldData,
				`./data/champions/${champEntry.championSaveName}_data.json`
			);
			await tools.saveJSONData(
				oldData,
				`./lol_scraper/data/champions/inGameData/${champEntry.championSaveName}_data.json`
			);
			console.log('inGameData saved: ', championName);
		} catch (err) {
			tools.reportError('failed scrapping inGameData', championName, err.message);
			console.error('\nfailed scraping inGameData: \t', err.message);
			console.error('\n', err.stack, '\n');
		}
	}

	console.log('scraping inGameData end\n');
	console.log('-----------------------\n');
}
