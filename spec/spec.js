var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	webdriver = require('selenium-webdriver');

const PORT = 8000;
const URL = 'http://localhost:' + PORT + '/test/index.html';

function handleRequest(request, response) {
	var requestUrl = url.parse(request.url);
	var path = __dirname + requestUrl.pathname;
	fs.exists(path, function (exists) {
		try {
			if (exists) {
				response.writeHead(200);
				fs.createReadStream(path).pipe(response);
			} else {
				response.writeHead(500);
			}
		} finally {
			response.end();
		}
	});
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
		// take a screenshot of the page:
		browser.takeScreenshot().then( function (data) {
			browser.quit();
			var base64Data = data.replace(/^data:image\/png;base64,/, "");
			var path = 'test/screenshots/it_opens.png';
			fs.writeFile(path, base64Data, 'base64');
			console.log('wrote %s', path);
			done();
		} );
	} );

	it('opens', function () {
		console.log('it opens!');
	});

});
