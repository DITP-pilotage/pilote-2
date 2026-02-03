import type { NextApiRequest, NextApiResponse } from "next";
import { configuration } from "@/config";

export function onlyCron(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers["authorization"];
    const expectedSecret = configuration().cron.authSecret;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const providedSecret = authHeader.slice(7);
    if (providedSecret !== expectedSecret) {
      return res
        .status(403)
        .json({ error: "Invalid CRON authentication secret" });
    }

    await handler(req, res);
  };
}
