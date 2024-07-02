import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";
import path from "path";
import url from "url";

// Directory to serve files from
const webDirectory = path.resolve(__dirname, "web");

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = `${webDirectory}${parsedUrl.pathname}`;

    // Prevent directory traversal
    pathname = pathname.replace(/^(\.\.[\/\\])+/, '');

    fs.exists(pathname, (exist) => {
        if (!exist) {
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        // If is a directory, then look for index.html
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }

        // Read file from file system
        fs.readFile(pathname, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
                return;
            }

            // Set Content-type based on file extension
            const ext = path.parse(pathname).ext;
            res.setHeader('Content-type', mimeType[ext] || 'text/plain');
            res.end(data);
        });
    });
});

// List of MIME types
const mimeType = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.wasm': 'application/wasm'
};

// Create WebSocket server
const wss = new WebSocketServer({ server });

const connections = [];

wss.on("connection", (client) => {
    connections.push(client);

    client.on("close", () => {
        connections.splice(connections.indexOf(client), 1);
    });
});

// Watch the /web directory for changes
fs.watch(webDirectory, { recursive: true }, (eventType, filename) => {
    if (filename) {

        // Send reload message to all connected clients
        connections.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send("reload");
            }
        });
    }
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
