import { createServer, type Server } from "node:http";
import { request } from "node:http";
import { AddressInfo } from "node:net";

import { serve } from "@hono/node-server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../app.ts";

/** Amont en écho : renvoie le corps reçu. */
const startUpstream = (): Promise<{ server: Server; origin: string }> =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(Buffer.concat(chunks).toString("utf8"));
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });

/** Sans Content-Length, node passe en `Transfer-Encoding: chunked` : un `Request` construit à la main ne le reproduit pas. */
const postChunked = (url: string, parts: string[]): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = request(
      { hostname: target.hostname, port: target.port, path: target.pathname, method: "POST" },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }),
        );
      },
    );
    req.on("error", reject);
    for (const part of parts) req.write(part);
    req.end();
  });

describe("proxy catch-all", () => {
  let upstream: { server: Server; origin: string };
  let proxy: ReturnType<typeof serve>;
  let proxyUrl: string;

  beforeEach(async () => {
    upstream = await startUpstream();
    proxy = serve({ fetch: createApp({ targetOrigin: upstream.origin }).fetch, port: 0 });
    const { port } = proxy.address() as AddressInfo;
    proxyUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((r) => proxy.close(() => r(null)));
    await new Promise((r) => upstream.server.close(() => r(null)));
  });

  it("relaie un corps envoyé en Transfer-Encoding: chunked", async () => {
    const response = await postChunked(`${proxyUrl}/api/quoi-que-ce-soit`, ["bon", "jour"]);

    expect(response.status).toBe(200);
    expect(response.body).toBe("bonjour");
  });

  it("relaie un corps streamé en plusieurs morceaux sans en perdre", async () => {
    const chunks = Array.from({ length: 50 }, (_, i) => `chunk-${i};`);

    const response = await postChunked(`${proxyUrl}/api/flux`, chunks);

    expect(response.status).toBe(200);
    expect(response.body).toBe(chunks.join(""));
  });

  it("relaie un corps annoncé par Content-Length", async () => {
    const response = await fetch(`${proxyUrl}/api/quoi-que-ce-soit`, {
      method: "POST",
      body: "bonjour",
      headers: { "Content-Type": "text/plain" },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("bonjour");
  });
});
