import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { z } from "zod";
import { acmeChallengeStore } from "./acmeChallengeStore.ts";
import { onlyAcmeApiKey } from "./onlyAcmeApiKey.ts";

const challengeBodySchema = z.object({
  token: z.string().min(1),
  keyAuthorization: z.string().min(1),
});

/**
 * En-têtes hop-by-hop (RFC 9110 §7.6.1) : ils décrivent le lien avec le client, pas le
 * message. Un proxy qui les recopie décrit à l'amont une connexion qui n'existe pas.
 *
 * `transfer-encoding` est le cas qui mordait : un client qui streame sans Content-Length
 * fait passer node en `chunked`, le proxy recopiait l'en-tête, et fetch refusait d'envoyer
 * une requête annoncée chunked dont il gère lui-même le cadrage — d'où un 502 sur toute
 * requête à corps streamé.
 */
const EN_TETES_DE_TRANSPORT = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const sansEnTetesDeTransport = (enTetes: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(enTetes).filter(
      ([nom]) => !EN_TETES_DE_TRANSPORT.has(nom.toLowerCase()),
    ),
  );

export const createApp = ({ targetOrigin }: { targetOrigin: string }) => {
  const app = new Hono();

  app.get("/.well-known/acme-challenge/:token", (c) => {
    const token = c.req.param("token");
    const keyAuthorization = acmeChallengeStore.get(token);
    if (keyAuthorization === undefined) {
      return c.text("Not found", 404);
    }
    return c.text(keyAuthorization, 200, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    });
  });

  app.post(
    "/api/acme/challenge",
    onlyAcmeApiKey,
    zValidator("json", challengeBodySchema),
    (c) => {
      const { token, keyAuthorization } = c.req.valid("json");
      acmeChallengeStore.set(token, keyAuthorization);
      return c.json({ ok: true }, 201);
    },
  );

  app.delete("/api/acme/challenge/:token", onlyAcmeApiKey, (c) => {
    acmeChallengeStore.delete(c.req.param("token"));
    return c.body(null, 204);
  });

  app.all("*", async (c) => {
    const incoming = new URL(c.req.url);
    const target = targetOrigin + incoming.pathname + incoming.search;
    try {
      return await proxy(target, {
        raw: c.req.raw,
        headers: {
          ...sansEnTetesDeTransport(c.req.header()),
          "x-forwarded-host":
            c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "",
        },
        redirect: "manual",
      });
    } catch (err) {
      const cause = err instanceof Error ? err.cause : undefined;
      console.error("[acme-proxy] upstream fetch failed", {
        method: c.req.method,
        target,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        cause:
          cause instanceof Error
            ? { name: cause.name, message: cause.message, stack: cause.stack }
            : cause,
      });
      return c.text("Bad Gateway", 502);
    }
  });

  return app;
};
