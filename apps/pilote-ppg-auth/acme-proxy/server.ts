import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { acmeChallengeStore } from "./acmeChallengeStore.ts";
import { onlyAcmeApiKey } from "./onlyAcmeApiKey.ts";

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

  app.post("/api/acme/challenge", onlyAcmeApiKey, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as { token?: unknown }).token !== "string" ||
      typeof (body as { keyAuthorization?: unknown }).keyAuthorization !==
        "string"
    ) {
      return c.json(
        { error: "Body must be { token: string, keyAuthorization: string }" },
        400,
      );
    }
    const { token, keyAuthorization } = body as {
      token: string;
      keyAuthorization: string;
    };
    acmeChallengeStore.set(token, keyAuthorization);
    return c.json({ ok: true }, 201);
  });

  app.delete("/api/acme/challenge/:token", onlyAcmeApiKey, (c) => {
    acmeChallengeStore.delete(c.req.param("token"));
    return c.body(null, 204);
  });

  app.all("*", (c) => {
    const incoming = new URL(c.req.url);
    const target = targetOrigin + incoming.pathname + incoming.search;
    return proxy(target, {
      ...c.req,
      headers: {
        ...c.req.header(),
        "X-Forwarded-Host":
          c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "",
      },
    });
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
