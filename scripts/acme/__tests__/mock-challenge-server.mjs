// Mock du serveur de challenge ACME (webapp/auth) pour tester les hooks bash.
// - POST <n'importe quel path>  : stocke {token -> keyAuthorization}, 201
// - GET /.well-known/acme-challenge/:token : renvoie la keyAuthorization, 200/404
// - DELETE <path>?token= ou <path>/:token  : supprime, 204
// Journalise chaque requête (méthode, url, auth, body) en JSON-line dans $MOCK_LOG.
// Imprime "PORT=<port>" sur stdout une fois à l'écoute.
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const store = new Map();
const logFile = process.env.MOCK_LOG;

const log = (entry) => {
  if (logFile) appendFileSync(logFile, JSON.stringify(entry) + "\n");
};

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks).toString();
    log({
      method: req.method,
      path: url.pathname,
      search: url.search,
      authorization: req.headers["authorization"] ?? null,
      body,
    });

    // Sert le challenge
    const wellKnown = "/.well-known/acme-challenge/";
    if (req.method === "GET" && url.pathname.startsWith(wellKnown)) {
      const token = url.pathname.slice(wellKnown.length);
      const value = store.get(token);
      if (value === undefined) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain" }).end(value);
      return;
    }

    if (req.method === "POST") {
      const { token, keyAuthorization } = JSON.parse(body || "{}");
      store.set(token, keyAuthorization);
      res.writeHead(201, { "Content-Type": "application/json" }).end('{"stored":true}');
      return;
    }

    if (req.method === "DELETE") {
      const token = url.searchParams.get("token") ?? url.pathname.split("/").pop();
      store.delete(token);
      res.writeHead(204).end();
      return;
    }

    res.writeHead(405).end();
  });
});

server.listen(0, "127.0.0.1", () => {
  process.stdout.write(`PORT=${server.address().port}\n`);
});
