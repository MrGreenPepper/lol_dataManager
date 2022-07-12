import Puppeteer from 'puppeteer';

export async function startBrowser() {
	let browser;

	browser = await Puppeteer.launch({
		headless: true,
		devtools: true,
		defaultViewport: null,
		args: [
			'--disable-infobars',
			//'--display=1'
		],
	});
	return browser;
}
