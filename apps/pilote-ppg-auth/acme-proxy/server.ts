import { serve } from "@hono/node-server";
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

export const createApp = ({ targetOrigin }: { targetOrigin: string }) => {
  const app = new Hono();

  app.get("/.well-known/acme-challenge/:token", (c) => {
    const token = c.req.param("token");
    const keyAuthorization = acmeChallengeStore.get(token);
    if (keyAuthorization === undefined) {
      return c.text("Not found", 404);
    }
    return c.text(keyAuthorization, 200, { "Content-Type": "text/plain" });
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
          ...c.req.header(),
          "X-Forwarded-Host":
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

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const port = Number(process.env.PORT ?? "3000");
  const internalPort = Number(process.env.INTERNAL_PORT ?? "8080");
  const targetOrigin = `http://127.0.0.1:${internalPort}`;

  const app = createApp({ targetOrigin });

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(
      `[acme-proxy] listening on :${info.port} → forwarding to ${targetOrigin}`,
    );
  });
}
