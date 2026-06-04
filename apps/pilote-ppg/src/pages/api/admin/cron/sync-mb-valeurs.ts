import type { NextApiRequest, NextApiResponse } from "next";

import { configuration } from "@/config";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { baseUrl, roomIdSyncMbValeurs: roomId, accessToken } =
    configuration().tchap;
  const isProd = configuration().scalingoEnvironment === "PROD";

  try {
    const useCase = getContainer("mbSync").resolve("syncMbValeursUseCase");
    const result = await useCase.execute();

    logger.info(
      { categorie: "sync", source: "cron/sync-mb-valeurs", result },
      "Synchronisation mb-valeurs terminée avec succès",
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      { categorie: "sync", source: "cron/sync-mb-valeurs" },
      `Erreur synchronisation mb-valeurs : ${(error as Error).message}`,
    );

    const messageErreur = [
      "## ⚠️ Erreur lors de la synchronisation mb-valeurs",
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");

    if (isProd) {
      envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
