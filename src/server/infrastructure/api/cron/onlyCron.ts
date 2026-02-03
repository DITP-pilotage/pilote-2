import type { NextApiRequest, NextApiResponse } from "next";
import { configuration } from "@/config";

export class CronAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CronAuthError";
  }
}

export class CronMethodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CronMethodError";
  }
}

export function onlyCron(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Verify method
      if (req.method !== "POST") {
        throw new CronMethodError("Method not allowed");
      }

      // Verify auth header
      const authHeader = req.headers["authorization"];
      const expectedSecret = configuration().cron.authSecret;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new CronAuthError("Missing or invalid Authorization header");
      }

      const providedSecret = authHeader.slice(7); // Remove "Bearer "
      if (providedSecret !== expectedSecret) {
        throw new CronAuthError("Invalid CRON authentication secret");
      }

      await handler(req, res);
    } catch (error) {
      if (error instanceof CronMethodError) {
        return res.status(405).json({ error: error.message });
      }
      if (error instanceof CronAuthError) {
        return res.status(401).json({ error: error.message });
      }
      throw error;
    }
  };
}
