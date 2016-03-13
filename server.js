var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	url = require('url');

const PORT = 8000;
const URL = "http://127.0.0.1://localhost:" + PORT + "/test";

function handleRequest(request, response) {
	var pathname = url.parse(request.url).pathname,
		filename = path.join(process.cwd(), pathname);

	if (pathname === '/test') {
		filename += '/index.html';
		response.writeHead(200, {'Content-Type': 'text/html'});
	} else {
		response.writeHead(200, {'Content-Type': 'text/plain'});
	}

	var readStream = fs.createReadStream(filename);
	readStream.on('end', function () {
		response.end();
	});
	readStream.pipe(response);
}

var server = http.createServer(handleRequest);
server.listen(PORT, function () {
    console.log("server listening on: http://localhost:%s", PORT);
});

exports.PORT = PORT;
exports.URL = URL;
exports.server = server;
