import type { NextApiRequest, NextApiResponse } from "next";
import { acmeChallengeStore } from "@/server/infrastructure/acme/acmeChallengeStore";
import { onlyAcmeApiKey } from "@/server/infrastructure/api/acme/onlyAcmeApiKey";
import logger from "@/server/infrastructure/Logger";

const TOKEN_REGEX = /^[A-Za-z0-9_-]+$/;

function readTokenFromRequest(req: NextApiRequest): string | undefined {
  const fromQuery = req.query.token;
  if (typeof fromQuery === "string" && fromQuery.length > 0) {
    return fromQuery;
  }
  const fromBody = (req.body as { token?: unknown } | undefined)?.token;
  if (typeof fromBody === "string" && fromBody.length > 0) {
    return fromBody;
  }
  return undefined;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method === "POST") {
    const body = req.body as
      | { token?: unknown; keyAuthorization?: unknown }
      | undefined;
    const token = body?.token;
    const keyAuthorization = body?.keyAuthorization;

    if (typeof token !== "string" || !TOKEN_REGEX.test(token)) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    if (typeof keyAuthorization !== "string" || keyAuthorization.length === 0) {
      res.status(400).json({ error: "Invalid keyAuthorization" });
      return;
    }

    acmeChallengeStore.set(token, keyAuthorization);
    logger.info(
      { categorie: "acme", source: "admin/acme-challenge", token },
      "Challenge ACME stocké",
    );
    res.status(201).json({ token, stored: true });
    return;
  }

  if (req.method === "DELETE") {
    const token = readTokenFromRequest(req);
    if (typeof token !== "string" || !TOKEN_REGEX.test(token)) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const deleted = acmeChallengeStore.delete(token);
    logger.info(
      { categorie: "acme", source: "admin/acme-challenge", token, deleted },
      "Challenge ACME supprimé",
    );
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default onlyAcmeApiKey(handler);
