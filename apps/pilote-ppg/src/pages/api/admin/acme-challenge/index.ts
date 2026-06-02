import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { acmeChallengeStore } from "@/server/infrastructure/acme/acmeChallengeStore";
import { onlyAcmeApiKey } from "@/server/infrastructure/api/acme/onlyAcmeApiKey";
import logger from "@/server/infrastructure/Logger";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]+$/);

const postBodySchema = z.object({
  token: tokenSchema,
  keyAuthorization: z.string().min(1),
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method === "POST") {
    const parsed = postBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    const { token, keyAuthorization } = parsed.data;
    acmeChallengeStore.set(token, keyAuthorization);
    logger.info(
      { categorie: "acme", source: "admin/acme-challenge", token },
      "Challenge ACME stocké",
    );
    res.status(201).json({ token, stored: true });
    return;
  }

  if (req.method === "DELETE") {
    const tokenInput =
      req.query.token ?? (req.body as { token?: unknown } | undefined)?.token;
    const parsed = tokenSchema.safeParse(tokenInput);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const token = parsed.data;
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
