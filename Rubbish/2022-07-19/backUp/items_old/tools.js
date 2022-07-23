const puppeteer = require('puppeteer');
const fs = require('fs');

async function getItemList() {
	let url_itemList = 'https://leagueoflegends.fandom.com/wiki/List_of_items';
	let itemLinkList = [];
	let browser = await puppeteer.launch((options = { headless: true, defaultViewport: null }));
	let page = await browser.newPage();

	await page.goto(url_itemList);

	let rawData = await page.evaluate(() => {
		try {
			let element = document.getElementById('stickyMenuWrapper');
			let dtElements = element.querySelectorAll('dt');
			console.log(dtElements);
			console.log(element);
			let listContainer = element.querySelectorAll('div#stickyMenuWrapper div.tlist a, dt');

			console.log(listContainer);
			let contentEnd = false;
			// sort out all unecessary items
			listContainer = Array.prototype.filter.call(listContainer, (currentElement) => {
				try {
					if (currentElement.innerText.includes('Ornn')) contentEnd = true;
				} catch (e) {}
				return !contentEnd;
			});
			//sort out the markers, previously used for cutting unecessary items out

			listContainer = Array.prototype.filter.call(listContainer, (currentElement) => {
				console.log(currentElement.localName);
				if (currentElement.localName == 'dt') return false;
				else return true;
			});
			console.log(listContainer);
			let linkList = [];

			for (element of listContainer) {
				let itemName = element.querySelector('img');
				itemName = itemName.getAttribute('alt');
				itemName = itemName.replace('.png', '');
				itemName = itemName.replace(/item/g, '');
				itemName = itemName.replace(/Item/g, '');
				itemName = itemName.replace(/\)/g, '');
				itemName = itemName.replace(/\(/g, '');
				itemName = itemName.trim();

				// console.log(itemName);

				linkList.push([itemName, element.href]);
			}
			return linkList;
		} catch (err) {
			console.log(err);
		}
	});
	// console.log('bp');
	await browser.close();
	return rawData;
}
async function getItemData(itemLink) {
	let browser = await puppeteer.launch((options = { headless: true, defaultViewport: null }));
	let page = await browser.newPage();

	await page.goto(itemLink[1]);
	try {
		await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 500 });
	} catch (err) {
		console.log(err);
	}

	let itemData = await page.evaluate((test) => {
		let item = {};
		item.stats = {};
		item.active = {};
		item.passive = {};
		item.consume = {};
		item.recipe = {};
		item.availability = {};
		item.tags = {};
		try {
			let tempContainer = document.querySelectorAll(
				'aside.portable-infobox.pi-background.pi-theme-wikia.pi-layout-stacked section.pi-item.pi-group.pi-border-color, aside>h2'
			);
			console.log(tempContainer);
			let contentContainer = Array.prototype.filter.call(tempContainer, (container) => {
				// console.log('currentElement: ', container);
				let parent = container.parentElement;
				let pparent = parent.parentElement;
				let ppparent = pparent.parentElement;
				let displayToogle = true;
				try {
					if (parent.getAttribute('style').includes('none')) displayToogle = false;
				} catch (e) {
					// console.log(e);
				}
				try {
					if (pparent.getAttribute('style').includes('none')) displayToogle = false;
				} catch (e) {
					// console.log(e);
				}
				try {
					if (ppparent.getAttribute('style').includes('none')) displayToogle = false;
				} catch (e) {
					// console.log(e);
				}
				return displayToogle;
			});

			//	'aside.portable-infobox.pi-background.pi-theme-wikia.pi-layout-stacked section.pi-item.pi-group.pi-border-color, .portable-infobox.pi-background.pi-theme-wikia.pi-layout-stacked .pi-item.pi-header.pi-secondary-font.pi-item-spacing.pi-secondary-background'
			console.log('contentContainer: ', contentContainer);
			/**
			contentContainer = contentContainer.querySelectorAll(
				'section.pi-item.pi-group.pi-border-color, h2'
			); */
			//defining the different parts
			let container = {};
			container.name = {};
			container.icon = {};
			container.name.dom = [contentContainer[0]];
			container.icon.dom = [contentContainer[1]];

			let containerCategory = '';
			let _tempContainerArray = [];
			//for stopping after the first go threw, to prevent irritating data (f.e. sometimes there is a revision data version on the page)
			let menuToogle = false;
			let keyToogle = false;
			for (let i = 2; i < contentContainer.length; i++) {
				console.log(i);
				/** get the categories by checking for signal words in the HTML text, as long as there is no other
				 * signal word the content is added to a temporary array, as soon as another signal word
				 * appears this tempArray is push to the permanent data container under the current category
				 * afterwards the category is changed to the new signal word */
				let _currentText = contentContainer[i].innerText.toLowerCase();
				//if there is a new signal word change to category otherwise use the old category allocation
				if (_currentText.includes('active')) {
					/**new signal word found, if the tempArray isn't empty, attach the data to the permanent container
					 * and change to category to the new one afterwards
					 */
					if (_tempContainerArray.length > 0) {
						container[containerCategory] = {};
						container[containerCategory].dom = {};
						container[containerCategory].dom = _tempContainerArray;
					}
					_tempContainerArray = [];
					containerCategory = 'active';
				}
				if (!menuToogle) {
					switch (true) {
						case _currentText.includes('passive'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'passive';
							break;
						case _currentText.includes('stats'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'stats';
							break;
						case _currentText.includes('consume'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'consume';
							break;
						case _currentText.includes('limitations'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'limitations';
							break;
						case _currentText.includes('recipe'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'recipe';
							break;
						case _currentText.includes('available') ||
							_currentText.includes('availability'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							_tempContainerArray = [];
							containerCategory = 'available';
							break;
						case _currentText.includes('menu'):
							if (_tempContainerArray.length > 0) {
								container[containerCategory] = {};
								container[containerCategory].dom = {};
								container[containerCategory].dom = _tempContainerArray;
							}
							console.log('menu  toogle:', _tempContainerArray);
							_tempContainerArray = [];
							menuToogle = true;
							containerCategory = 'menu';
					}
				}
				if (_currentText.includes('keywords') && !keyToogle) {
					if (_tempContainerArray.length > 0) {
						container[containerCategory] = {};
						container[containerCategory].dom = {};
						container[containerCategory].dom = _tempContainerArray;
					}
					console.log('key  toogle:', _tempContainerArray);
					_tempContainerArray = [];
					containerCategory = 'keywords';
					_tempContainerArray.push(contentContainer[i]);
					container[containerCategory] = {};
					container[containerCategory].dom = {};
					container[containerCategory].dom = _tempContainerArray;
					keyToogle = true;
				}
				if (!menuToogle) _tempContainerArray.push(contentContainer[i]);
			}
			console.log('Container:', container);
			//get the container types and handle them concerning to there types
			let containerCategories = Object.keys(container);
			console.log('containerCat: \t', containerCategories);
			for (let i = 0; i < containerCategories.length; i++) {
				let _category = containerCategories[i];

				for (let n = 0; n < container[_category].dom.length; n++) {
					let _currentTab = container[_category].dom[n];
					console.log('current tab ', n, _currentTab);

					switch (_category) {
						case 'stats':
							//get the tables first
							let values = [];
							let statsArray = _currentTab.querySelectorAll(
								'div.pi-data-value.pi-font'
							);
							for (let s = 0; s < statsArray.length; s++) {
								values.push(statsArray[s].innerText);
							}
							item.stats.originHTML = _currentTab.innerHTML;
							item.stats.values = values;
							break;

						case 'passive':
							let pcontent = _currentTab.querySelector('div.pi-data-value.pi-font');
							let ptext = pcontent.innerText;

							item.passive.originHTML = _currentTab.innerHTML;
							item.passive.originText = ptext;
							break;

						case 'consume':
							let ccontent = _currentTab.querySelector('div.pi-data-value.pi-font');
							let ctext = ccontent.innerText;

							item.consume.originHTML = _currentTab.innerHTML;
							item.consume.originText = ctext;
							break;
						case 'active':
							let acontent = _currentTab.querySelector('div.pi-data-value.pi-font');
							let atext = acontent.innerText;

							item.active.originHTML = _currentTab.innerHTML;
							item.active.originText = atext;
							break;

						case 'recipe':
							switch (n) {
								case 0:
									break;
								case 1:
									//if total length is 2 its a basic item without a building path otherwise its a more advanced
									//item with a building path in the first table and the methaData in the second table
									if (container[_category].dom.length == 2) {
										let tableHead = _currentTab.querySelectorAll('thead th');
										let tableContent = _currentTab.querySelectorAll('tbody td');
										let recipeContent = [];
										let preItems = [];

										for (let i = 0; i < tableHead.length; i++) {
											recipeContent.push([
												tableHead[i].innerText,
												tableContent[i].innerText,
											]);
										}

										for (let i = 0; i < tableContent.length; i++) {
											preItems.push(
												tableContent[i].getAttribute('data-item')
											);
										}

										console.log(tableContent);
										item.recipe[n] = {};
										item.recipe[n] = recipeContent;
										item.recipe[n].preItems = preItems;
										item.recipe[n].originHTML = _currentTab.innerHTML;
									} else {
										console.log('creating build path: ', _currentTab);
										let buildPath = [];
										let neededItems = _currentTab.querySelectorAll(
											'span.inline-image.item-icon.tooltips-init-complete'
										);
										let goldCosts = _currentTab.querySelector(
											'span.inline-image.label-after'
										);
										goldCosts = goldCosts.innerText;
										for (let ic = 0; ic < neededItems.length; ic++) {
											console.log('bp: \t', neededItems[ic]);
											buildPath.push(
												neededItems[ic].getAttribute('data-item')
											);
										}
										console.log('BUILDPATH:', buildPath);
										item.recipe.buildPath = buildPath;
										item.recipe.combineCosts = goldCosts;
										item.recipe[n] = {};
										item.recipe[n].originHTML = _currentTab.innerHTML;
									}
									break;
								default:
									let tableHead = _currentTab.querySelectorAll('thead th');
									let tableContent = _currentTab.querySelectorAll('tbody td');
									console.log(tableHead);
									console.log(tableContent);
									let recipeContent = [];
									for (let i = 0; i < tableHead.length; i++) {
										console.log(
											tableHead[i].innerText,
											tableContent[i].innerText
										);
										recipeContent.push([
											tableHead[i].innerText,
											tableContent[i].innerText,
										]);
									}
									console.log(recipeContent);
									item.recipe[n] = {};
									item.recipe[n] = recipeContent;
									item.recipe[n].originHTML = _currentTab.innerHTML;
									break;
							}
							break;

						case 'availability':
							item.availability.originHTML = _currentTab.innerHTML;
							break;

						case 'keywords':
							item.tags.originHTML = _currentTab.innerHTML;
							break;
					}
				}
				console.log('item: ', item);
			}

			console.log('item: ', item);
			return item;
		} catch (err) {
			console.log(err);
		}
	});
	itemData.name = itemLink[0];
	itemData.link = itemLink[1];
	await browser.close();
	return itemData;
}

function saveRawData(rawData) {
	return new Promise((resolve) => {
		let itemName = rawData.name;
		let savePath = `./data/${itemName}_rawData.json`;
		let stringData = JSON.stringify(rawData);
		fs.writeFile(savePath, stringData, function (err, result) {
			if (err) {
				console.log(`"\x1b[31m" ${itemName} "\x1b[0m" - failed to save analysed Data `);
				console.log(err.message);
			} else {
				resolve(result);
			}
		});
	});
}

async function saveItemList(itemList) {
	return new Promise((resolve) => {
		let savePath = `./data/itemList.json`;
		fs.writeFile(savePath, JSON.stringify(itemList), function (err, result) {
			if (err) {
				console.log(err.message);
			} else {
				resolve(result);
			}
		});
	});
}
function loadItemList() {
	return new Promise((resolve) => {
		let loadPath = `./data/itemList.json`;

		let itemList = JSON.parse(fs.readFileSync(loadPath, 'utf8'));
		resolve(itemList);
	});
}
async function saveData(itemData) {
	return new Promise((resolve) => {
		let itemName = itemData.name;
		itemName = itemName.toLowerCase();
		let savePath = `./data/${itemName}_data.json`;
		fs.writeFile(savePath, JSON.stringify(itemData), function (err, result) {
			if (err) {
				console.log(`"\x1b[31m" ${itemName} "\x1b[0m" - failed to save analysed Data `);
				console.log(err.message);
			} else {
				resolve(result);
			}
		});
	});
}

async function loadRawData(itemName) {
	return new Promise((resolve) => {
		let loadPath = `./data/${itemName}_rawData.json`;

		let itemData = JSON.parse(fs.readFileSync(loadPath, 'utf8'));
		resolve(itemData);
	});
}

module.exports = {
	getItemList,
	getItemData,
	saveData,
	saveRawData,
	saveItemList,
	loadRawData,
	loadItemList,
};
