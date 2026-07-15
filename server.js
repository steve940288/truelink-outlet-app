// Entry point for cPanel's "Setup Node.js App" (Passenger). Passenger runs
// this file directly and expects it to start an HTTP server listening on
// the port it assigns via process.env.PORT.
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`Ready on port ${port}`);
  });
});
