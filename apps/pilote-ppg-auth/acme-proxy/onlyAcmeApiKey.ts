import type { MiddlewareHandler } from "hono";

export const onlyAcmeApiKey: MiddlewareHandler = async (c, next) => {
  const expectedSecret = process.env.ACME_UPLOAD_API_KEY ?? "";
  if (!expectedSecret) {
    return c.json({ error: "ACME upload endpoint not configured" }, 503);
  }

  const authHeader = c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const providedSecret = authHeader.slice(7);
  if (providedSecret !== expectedSecret) {
    return c.json({ error: "Invalid ACME API key" }, 403);
  }

  await next();
};
