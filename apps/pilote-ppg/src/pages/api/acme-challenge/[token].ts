import type { NextApiRequest, NextApiResponse } from "next";
import { acmeChallengeStore } from "@/server/infrastructure/acme/acmeChallengeStore";

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const token = req.query.token;
  if (typeof token !== "string" || token.length === 0) {
    return res.status(404).end();
  }

  const keyAuthorization = acmeChallengeStore.get(token);
  if (!keyAuthorization) {
    return res.status(404).end();
  }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(keyAuthorization);
}

export default handler;
