import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { onlyAcmeApiKey } from "../onlyAcmeApiKey.ts";

const buildApp = () => {
  const app = new Hono();
  app.post("/protected", onlyAcmeApiKey, (c) => c.json({ ok: true }));
  return app;
};

describe("onlyAcmeApiKey", () => {
  const originalSecret = process.env.ACME_UPLOAD_API_KEY;

  beforeEach(() => {
    process.env.ACME_UPLOAD_API_KEY = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ACME_UPLOAD_API_KEY;
    } else {
      process.env.ACME_UPLOAD_API_KEY = originalSecret;
    }
  });

  it("retourne 503 quand le secret n'est pas configuré", async () => {
    delete process.env.ACME_UPLOAD_API_KEY;
    const app = buildApp();

    const res = await app.request("/protected", { method: "POST" });

    expect(res.status).toEqual(503);
  });

  it("retourne 401 sans header Authorization", async () => {
    const app = buildApp();

    const res = await app.request("/protected", { method: "POST" });

    expect(res.status).toEqual(401);
  });

  it("retourne 401 quand le header n'utilise pas le schéma Bearer", async () => {
    const app = buildApp();

    const res = await app.request("/protected", {
      method: "POST",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });

    expect(res.status).toEqual(401);
  });

  it("retourne 403 quand le secret fourni ne correspond pas", async () => {
    const app = buildApp();

    const res = await app.request("/protected", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
    });

    expect(res.status).toEqual(403);
  });

  it("laisse passer la requête quand le Bearer correspond au secret attendu", async () => {
    const app = buildApp();

    const res = await app.request("/protected", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });

    expect(res.status).toEqual(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
