import * as tools from '../tools.js';
import * as browserControl from './tools/browserControl.js';

export async function getInGameData() {
	//TODO: Cassiopeia has no boots, aphelios no R, khazix, viego, viktor and kaisa missing too
	// duno if this are all failures --> test
	//
	//

	let championList = await tools.getChampionList();

	for (let championName of championList) {
		try {
			const browser = await browserControl.startBrowser();
			const page = await browser.newPage();
			let baseUrl = 'https://www.leagueofgraphs.com/champions/builds/';

			let url = baseUrl + championName.toLowerCase();
			console.log('scraping url: ', url);

			//connects to every ChampionSite and scrapes selected raw Data
			await page.goto(url);
			await page.waitForSelector('div#filters-menu');

			let championRawData = await page.evaluate(() => {
				let champion = {};
				champion.abilities = {};
				champion.abilities.skillsOrder = {};
				champion.items = {};
				champion.masteries = {};

				//Skill-Order:
				let skillsOrderRaw = document.querySelectorAll('td.skillCell');
				let skillsOrder = [];
				for (let i = 0; i < 72; i++) {
					skillsOrder[i] = skillsOrderRaw[i].innerText;
				}
				champion.abilities.skillsOrder = skillsOrder;

				//Items:
				let startItems = [];
				let smallItems = document.querySelectorAll('div.medium-11.columns');
				let items_start = smallItems[0].querySelectorAll('div.championSpell');
				for (let i = 0; i < items_start.length; i++) {
					startItems[i] = items_start[i].querySelector('img').getAttribute('alt');
				}
				champion.items.start = {};
				champion.items.start = startItems;

				let boots = smallItems[1].querySelector('img').getAttribute('alt');
				champion.items.boots = boots;

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
				let masteries_container = document.querySelectorAll('div.box.box-padding-10.overviewBox');
				masteries_container = masteries_container[7];

				let masteries_mainRaw = masteries_container.querySelectorAll('th');
				let masteries_main = [];
				masteries_main[0] = masteries_mainRaw[0].querySelector('img').getAttribute('src');
				masteries_main[0] = masteries_main[0].replace('//lolg-cdn.porofessor.gg/img/perks/11.4/64/', '');
				masteries_main[0] = masteries_main[0].replace('.png', '');
				masteries_main[1] = masteries_mainRaw[1].querySelector('img').getAttribute('src');
				masteries_main[1] = masteries_main[1].replace('//lolg-cdn.porofessor.gg/img/perks/11.4/64/', '');
				masteries_main[1] = masteries_main[1].replace('.png', '');
				champion.masteries.main = masteries_main;

				//small mastery points:
				//0-11 small masteries from main
				//12 - 17 small masteries from second
				//18 - 19 extra runes
				let smallMasteries_container = masteries_container.querySelectorAll('td');
				let smallMasteries = [];
				for (let i = 0; i < smallMasteries_container.length; i++) {
					let masteryPointName = smallMasteries_container[i].querySelector('img').getAttribute('alt');
					console.log(masteryPointName);
					//if there is a div with style modifier the opacity is lowered --> mastery point is inactiv
					let statusChecker = smallMasteries_container[i].querySelector('div[style="opacity: 0.2;"]');
					let status = false;
					if (statusChecker == null) status = true;
					console.log(status);
					let couple = [masteryPointName, status];
					smallMasteries[i] = couple;
				}
				champion.masteries.smallMasteries = smallMasteries;

				//Summoner Spells:
				let summonerSpells_container = document.querySelectorAll('div.box.box-padding-10.overviewBox');
				summonerSpells_container = summonerSpells_container[6];
				let summonerSpells = [];
				let summonerSpellsRaw = summonerSpells_container.querySelectorAll('img');
				summonerSpells[0] = summonerSpellsRaw[0].getAttribute('alt');
				summonerSpells[1] = summonerSpellsRaw[1].getAttribute('alt');
				champion.summonerSpells = summonerSpells;

				console.log(champion);

				return champion;
			});

			await browser.close();
			let championData = await tools.loadJSONData(`./lol_scraper/data/champion_baseData/${championName}_data.json`);
			championData.scraped_data.inGameData.items = championRawData.items;

			championData.scraped_data.inGameData.masteries = championRawData.masteries;
			championData.scraped_data.inGameData.skillsOrder = championRawData.abilities.skillsOrder;
			championData.scraped_data.inGameData.summonerSpells = championRawData.summonerSpells;
			let path = './scraper/data/' + championName + '_inGameData.json';

			tools.saveCSVData(championData, `./lol_scraper/data/champion_inGameData/${championData.name}_data.json`);
			console.log('championData saved: ', path);
		} catch (err) {
			tools.reportError('failed scrapping inGameData', championName, err.message);
			console.log(err);
		}
	}
}
