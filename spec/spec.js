var fs = require('fs');
var http = require('http');
var webdriver = require('selenium-webdriver');

const PORT = 8000;
const URL = 'http://localhost:' + PORT + '/test';

function handleRequest(request, response){
    response.end('It Works!! Path Hit: ' + request.url);
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log("Server listening on: http://localhost:%s", PORT);
});

var firefox = new webdriver.Builder().forBrowser('firefox').build();

describe('WebVRApp', function () {

	var browser = firefox;

	beforeEach( function (done) {
		browser.get(URL).then(done);
	} );

	afterEach( function (done) {
		browser.takeScreenshot().then( function (data) {
			var base64Data = data.replace(/^data:image\/png;base64,/, "");
			fs.writeFile('test/screenshots/it_opens.png', base64Data, 'base64');
			done();
		} ).catch( function (error) {
			console.error(error);
		} );
	} );

	it('opens', function () {
		console.log('it opens!');
	});

});
