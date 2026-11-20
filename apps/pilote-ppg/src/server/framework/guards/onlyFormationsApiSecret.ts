import { createHash, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { configuration } from "@/config";
import { errorHandler } from "@/server/app/error-boundary/error-handler";
import { logger } from "@/server/framework/logger";

const bearerHeaderSchema = z
  .string()
  .startsWith("Bearer ")
  .transform((header) => header.slice("Bearer ".length));

// Empreintes de même longueur : timingSafeEqual compare en temps constant.
const memeSecret = (recu: string, attendu: string) =>
  timingSafeEqual(
    createHash("sha256").update(recu).digest(),
    createHash("sha256").update(attendu).digest(),
  );

const refuser = (res: NextApiResponse, statut: number, error: string): void => {
  logger.warn(
    { categorie: "auth", source: "onlyFormationsApiSecret", statut },
    error,
  );
  res.status(statut).json({ error });
};

// Réservé à la synchronisation des formations par copilot : un secret dédié, qui
// n'ouvre que cette route.
export function onlyFormationsApiSecret(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "PUT") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const secretAttendu = configuration().formations.apiSecret;
    if (!secretAttendu) {
      return refuser(res, 503, "Synchronisation des formations non configurée");
    }

    const secretRecu = bearerHeaderSchema.safeParse(
      req.headers["authorization"],
    );
    if (!secretRecu.success) {
      return refuser(res, 401, "Header Authorization absent ou invalide");
    }

    if (!memeSecret(secretRecu.data, secretAttendu)) {
      return refuser(res, 403, "Secret de synchronisation invalide");
    }

    await errorHandler(handler)(req, res);
  };
}
