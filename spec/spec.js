var fs = require('fs'),
	webdriver = require('selenium-webdriver');

var server = require('../server.js');

var firefox = new webdriver.Builder().forBrowser('firefox').build();

describe('WebVRApp', function () {

	var browser = firefox;

	beforeEach( function (done) {
		browser.get(server.URL).then(done);
	} );

	afterEach( function (done) {
		// take a screenshot of the page:
		browser.takeScreenshot().then( function (data) {
			browser.quit();
			var base64Data = data.replace(/^data:image\/png;base64,/, "");
			var filepath = 'test/screenshots/it_opens.png';
			fs.writeFile(filepath, base64Data, 'base64');
			console.log('wrote %s', filepath);
			done();
		} );
	} );

	it('opens', function () {
		console.log('it opens!');
	});

	// it('entersFullscreen', function () {
	// 	console.log('it opens!');
	// });

});
