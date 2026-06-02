import type { MiddlewareHandler } from "hono";
import { z } from "zod";

const bearerHeaderSchema = z
  .string()
  .startsWith("Bearer ")
  .transform((header) => header.slice("Bearer ".length));

export const onlyAcmeApiKey: MiddlewareHandler = async (c, next) => {
  const expectedSecret = process.env.ACME_UPLOAD_API_KEY ?? "";
  if (!expectedSecret) {
    return c.json({ error: "ACME upload endpoint not configured" }, 503);
  }

  const parsed = bearerHeaderSchema.safeParse(c.req.header("authorization"));
  if (!parsed.success) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  if (parsed.data !== expectedSecret) {
    return c.json({ error: "Invalid ACME API key" }, 403);
  }

  await next();
};
