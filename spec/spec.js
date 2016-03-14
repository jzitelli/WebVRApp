var fs = require('fs'),
	webdriver = require('selenium-webdriver');

var server = require('../server.js');

var firefox = new webdriver.Builder().forBrowser('firefox').build();
var chrome = new webdriver.Builder().forBrowser('chrome').build();

function writeScreenshot(data, file) {
	var base64Data = data.replace(/^data:image\/png;base64,/, "");
	fs.writeFileSync(file, base64Data, 'base64');
	console.log('wrote %s', file);
}

describe('WebVRApp', function () {

	describe('inFirefox', function () {
		afterEach( function (done) {
			var file = 'test/screenshots/firefox/it_opens.png';
			firefox.takeScreenshot().then( function (data) {
				writeScreenshot(data, file);
				done();
			} );
		}, 10000);
		it('opens', function () {
			firefox.get(server.URL);
			console.log('it opens in Firefox!');
		});
	});

	describe('inChrome', function () {
		afterEach( function (done) {
			var file = 'test/screenshots/chrome/it_opens.png';
			chrome.takeScreenshot().then( function (data) {
				writeScreenshot(data, file);
				done();
			} );
		}, 10000);
		it('opens', function () {
			chrome.get(server.URL);
			console.log('it opens in Chrome!');
		});
	});

	afterAll( function () {
		firefox.quit();
		chrome.quit();
	} );

});
