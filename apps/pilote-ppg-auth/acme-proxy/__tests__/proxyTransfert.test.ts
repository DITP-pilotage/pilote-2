import { createServer, type Server } from "node:http";
import { request } from "node:http";
import { AddressInfo } from "node:net";

import { serve } from "@hono/node-server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app.ts";

/** Sert d'amont : renvoie ce qu'il a reçu, pour qu'on voie si le corps a survécu. */
const demarrerAmont = (): Promise<{ serveur: Server; origine: string }> =>
  new Promise((resolve) => {
    const serveur = createServer((req, res) => {
      const morceaux: Buffer[] = [];
      req.on("data", (m: Buffer) => morceaux.push(m));
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(Buffer.concat(morceaux).toString("utf8"));
      });
    });
    serveur.listen(0, "127.0.0.1", () => {
      const { port } = serveur.address() as AddressInfo;
      resolve({ serveur, origine: `http://127.0.0.1:${port}` });
    });
  });

/**
 * Envoie une requête SANS Content-Length : node bascule alors de lui-même en
 * `Transfer-Encoding: chunked`. C'est ce que fait n'importe quel client qui streame,
 * et ça ne se reproduit pas en construisant un `Request` à la main.
 */
const posterEnChunked = (url: string, corps: string[]): Promise<{ statut: number; corps: string }> =>
  new Promise((resolve, reject) => {
    const cible = new URL(url);
    const req = request(
      { hostname: cible.hostname, port: cible.port, path: cible.pathname, method: "POST" },
      (res) => {
        const morceaux: Buffer[] = [];
        res.on("data", (m: Buffer) => morceaux.push(m));
        res.on("end", () =>
          resolve({ statut: res.statusCode ?? 0, corps: Buffer.concat(morceaux).toString("utf8") }),
        );
      },
    );
    req.on("error", reject);
    for (const morceau of corps) req.write(morceau);
    req.end();
  });

describe("proxy catch-all", () => {
  let amont: { serveur: Server; origine: string };
  let proxy: ReturnType<typeof serve>;
  let urlProxy: string;

  beforeEach(async () => {
    amont = await demarrerAmont();
    proxy = serve({ fetch: createApp({ targetOrigin: amont.origine }).fetch, port: 0 });
    const { port } = proxy.address() as AddressInfo;
    urlProxy = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((r) => proxy.close(() => r(null)));
    await new Promise((r) => amont.serveur.close(() => r(null)));
  });

  it("relaie un corps envoyé en Transfer-Encoding: chunked", async () => {
    const reponse = await posterEnChunked(`${urlProxy}/api/quoi-que-ce-soit`, ["bon", "jour"]);

    expect(reponse.statut).toBe(200);
    expect(reponse.corps).toBe("bonjour");
  });

  it("relaie un corps streamé en plusieurs morceaux sans en perdre", async () => {
    const morceaux = Array.from({ length: 50 }, (_, i) => `morceau-${i};`);

    const reponse = await posterEnChunked(`${urlProxy}/api/flux`, morceaux);

    expect(reponse.statut).toBe(200);
    expect(reponse.corps).toBe(morceaux.join(""));
  });

  it("relaie un corps annoncé par Content-Length", async () => {
    const reponse = await fetch(`${urlProxy}/api/quoi-que-ce-soit`, {
      method: "POST",
      body: "bonjour",
      headers: { "Content-Type": "text/plain" },
    });

    expect(reponse.status).toBe(200);
    expect(await reponse.text()).toBe("bonjour");
  });
});
