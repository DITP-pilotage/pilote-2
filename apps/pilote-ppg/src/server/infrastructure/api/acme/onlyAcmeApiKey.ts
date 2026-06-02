import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { configuration } from "@/config";
import { errorHandler } from "@/server/app/error-boundary/error-handler";

const ALLOWED_METHODS = ["POST", "DELETE"];

const bearerHeaderSchema = z
  .string()
  .startsWith("Bearer ")
  .transform((header) => header.slice("Bearer ".length));

export function onlyAcmeApiKey(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!ALLOWED_METHODS.includes(req.method ?? "")) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const expectedSecret = configuration().acme.uploadApiKey;
    if (!expectedSecret) {
      return res
        .status(503)
        .json({ error: "ACME upload endpoint not configured" });
    }

    const parsed = bearerHeaderSchema.safeParse(req.headers["authorization"]);
    if (!parsed.success) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    if (parsed.data !== expectedSecret) {
      return res.status(403).json({ error: "Invalid ACME API key" });
    }

    await errorHandler(handler)(req, res);
  };
}
