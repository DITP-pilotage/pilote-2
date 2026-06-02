import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acmeChallengeStore } from "../acmeChallengeStore.ts";
import { createApp } from "../app.ts";

const targetOrigin = "http://127.0.0.1:1";

describe("ACME routes", () => {
  beforeEach(() => {
    vi.stubEnv("ACME_UPLOAD_API_KEY", "test-secret");
    acmeChallengeStore.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    acmeChallengeStore.clear();
  });

  describe("GET /.well-known/acme-challenge/:token", () => {
    it("retourne 200 + keyAuthorization en text/plain quand le token existe", async () => {
      acmeChallengeStore.set("abc", "abc.thumb");
      const app = createApp({ targetOrigin });

      const res = await app.request("/.well-known/acme-challenge/abc");

      expect(res.status).toEqual(200);
      expect(res.headers.get("content-type")).toMatch(/text\/plain/);
      expect(await res.text()).toEqual("abc.thumb");
    });

    it("retourne 404 quand le token est absent", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/.well-known/acme-challenge/missing");

      expect(res.status).toEqual(404);
    });
  });

  describe("POST /api/acme/challenge", () => {
    it("retourne 401 sans Bearer", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "abc", keyAuthorization: "abc.thumb" }),
      });

      expect(res.status).toEqual(401);
    });

    it("retourne 400 quand le body n'est pas du JSON", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
          "Content-Type": "application/json",
        },
        body: "not-json",
      });

      expect(res.status).toEqual(400);
    });

    it("retourne 400 quand le body manque token ou keyAuthorization", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "abc" }),
      });

      expect(res.status).toEqual(400);
    });

    it("stocke le challenge et retourne 201 avec un body valide", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-secret",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "abc", keyAuthorization: "abc.thumb" }),
      });

      expect(res.status).toEqual(201);
      expect(acmeChallengeStore.get("abc")).toEqual("abc.thumb");
    });
  });

  describe("DELETE /api/acme/challenge/:token", () => {
    it("retourne 401 sans Bearer", async () => {
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge/abc", {
        method: "DELETE",
      });

      expect(res.status).toEqual(401);
    });

    it("supprime le challenge et retourne 204 avec Bearer valide", async () => {
      acmeChallengeStore.set("abc", "abc.thumb");
      const app = createApp({ targetOrigin });

      const res = await app.request("/api/acme/challenge/abc", {
        method: "DELETE",
        headers: { Authorization: "Bearer test-secret" },
      });

      expect(res.status).toEqual(204);
      expect(acmeChallengeStore.get("abc")).toBeUndefined();
    });
  });
});
