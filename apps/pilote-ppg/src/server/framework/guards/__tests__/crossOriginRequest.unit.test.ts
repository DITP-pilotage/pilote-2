import { isCrossOriginUnsafeRequest } from "@/server/framework/guards/crossOriginRequest";

function buildRequest(method: string, headers: Record<string, string> = {}) {
  return { method, headers: new Headers(headers) };
}

describe("isCrossOriginUnsafeRequest", () => {
  it.each(["GET", "HEAD", "OPTIONS"])(
    "laisse passer une requête %s même venue d'un autre site",
    (method) => {
      const request = buildRequest(method, { "sec-fetch-site": "cross-site" });

      expect(isCrossOriginUnsafeRequest(request)).toBe(false);
    },
  );

  it.each(["same-origin", "none"])(
    "laisse passer une écriture marquée %s par le navigateur",
    (secFetchSite) => {
      const request = buildRequest("POST", { "sec-fetch-site": secFetchSite });

      expect(isCrossOriginUnsafeRequest(request)).toBe(false);
    },
  );

  it.each(["cross-site", "same-site"])(
    "refuse une écriture marquée %s par le navigateur",
    (secFetchSite) => {
      const request = buildRequest("POST", { "sec-fetch-site": secFetchSite });

      expect(isCrossOriginUnsafeRequest(request)).toBe(true);
    },
  );

  it.each(["PUT", "PATCH", "DELETE"])(
    "refuse une requête %s venue d'un autre site",
    (method) => {
      const request = buildRequest(method, { "sec-fetch-site": "cross-site" });

      expect(isCrossOriginUnsafeRequest(request)).toBe(true);
    },
  );

  it("fait primer Sec-Fetch-Site sur une origine identique à l'hôte", () => {
    const request = buildRequest("POST", {
      "sec-fetch-site": "cross-site",
      origin: "https://pilote.example",
      host: "pilote.example",
    });

    expect(isCrossOriginUnsafeRequest(request)).toBe(true);
  });

  it("laisse passer une écriture sans en-tête de navigateur", () => {
    const request = buildRequest("POST", { host: "pilote.example" });

    expect(isCrossOriginUnsafeRequest(request)).toBe(false);
  });

  describe("sans Sec-Fetch-Site", () => {
    it("laisse passer une écriture dont l'origine est l'hôte", () => {
      const request = buildRequest("POST", {
        origin: "https://pilote.example",
        host: "pilote.example",
      });

      expect(isCrossOriginUnsafeRequest(request)).toBe(false);
    });

    it("laisse passer une écriture dont l'origine est l'hôte transmis par le reverse proxy", () => {
      const request = buildRequest("POST", {
        origin: "https://pilote.example",
        host: "localhost:3000",
        "x-forwarded-host": "pilote.example",
      });

      expect(isCrossOriginUnsafeRequest(request)).toBe(false);
    });

    it.each([
      "https://attaquant.example",
      "https://sous-domaine.pilote.example",
      "https://pilote.example:8443",
      "null",
    ])("refuse une écriture d'origine %s", (origin) => {
      const request = buildRequest("POST", { origin, host: "pilote.example" });

      expect(isCrossOriginUnsafeRequest(request)).toBe(true);
    });
  });
});
