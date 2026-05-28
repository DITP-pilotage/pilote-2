import type { NextApiRequest, NextApiResponse } from "next";
import { configuration } from "@/config";
import { errorHandler } from "@/server/app/error-boundary/error-handler";

const ALLOWED_METHODS = ["POST", "DELETE"];

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

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const providedSecret = authHeader.slice(7);
    if (providedSecret !== expectedSecret) {
      return res.status(403).json({ error: "Invalid ACME API key" });
    }

    await errorHandler(handler)(req, res);
  };
}
