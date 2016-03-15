var fs = require('fs'),
	webdriver = require('selenium-webdriver');

var server = require('../server.js');

var firefox = new webdriver.Builder().forBrowser('firefox').build();
var chrome;

// try {
// 	chrome = new webdriver.Builder().forBrowser('chrome').build();
// } catch (error) {
// 	console.error(error);
// }

function writeScreenshot(data, file) {
	var base64Data = data.replace(/^data:image\/png;base64,/, "");
	fs.writeFileSync(file, base64Data, 'base64');
	console.log('wrote %s', file);
}

describe('WebVRApp', function () {

	describe('inFirefox', function () {

		beforeEach( function () {
			firefox.get(server.URL);
		} );

		afterEach( function (done) {
			var file = 'test/screenshots/firefox/' + this.name + '.png';
			firefox.takeScreenshot().then( function (data) {
				writeScreenshot(data, file);
				done();
			} );
		}, 20000);

		it('enters fullscreen', function () {

			this.name = 'it_enters_fullscreen';
			var fsButton = firefox.findElement(webdriver.By.id('fsButton'));

			expect(fsButton).not.toBeNull();

			fsButton.click();
			firefox.sleep(2000); // maybe there is a more robust way, listen to events?
			var fsElem = firefox.executeScript("return document.mozFullScreenElement;");

			expect(fsElem).not.toBeNull();

		}, 20000);

		it('enters VR', function (done) {

			this.name = 'it_enters_VR';

			var vrButton = firefox.findElement(webdriver.By.id('vrButton'));
			expect(vrButton).not.toBeNull();

			vrButton.click();
			firefox.sleep(2000);

		}, 20000);

	});

	// if (chrome) {
	// 	describe('inChrome', function () {

	// 		this.browser = chrome;

	// 		beforeEach( function () {
	// 			this.browser.get(server.URL);
	// 		} );

	// 		afterEach( function (done) {
	// 			var file = 'test/screenshots/chrome/it_opens.png';
	// 			this.browser.takeScreenshot().then( function (data) {
	// 				writeScreenshot(data, file);
	// 				done();
	// 			} );
	// 		}, 20000);

	// 	});
	// }

	afterAll( function () {
		if (chrome) chrome.quit();
		firefox.quit();
	} );

});
