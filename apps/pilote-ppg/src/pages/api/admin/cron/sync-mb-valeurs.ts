import type { NextApiRequest, NextApiResponse } from "next";

import { configuration } from "@/config";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";
import { type SyncMetadonneesResultat } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";

const INDICATEURS_A_SYNCHRONISER = ["IND-003"];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    baseUrl,
    roomIdSyncMbValeurs: roomId,
    accessToken,
  } = configuration().tchap;
  const isProd = configuration().scalingoEnvironment === "PROD";

  const container = getContainer("mbSync");

  let metadonnees: SyncMetadonneesResultat;

  try {
    metadonnees = await container
      .resolve("syncMbMetadonneesUseCase")
      .execute(INDICATEURS_A_SYNCHRONISER);
  } catch (error) {
    logger.error(
      { categorie: "sync", source: "cron/sync-mb-valeurs" },
      `Erreur synchronisation mb-metadonnees : ${(error as Error).message}`,
    );

    if (isProd) {
      envoieMessageTchap(
        "## ⚠️ Erreur lors de la synchronisation mb-metadonnees\nVeuillez regarder les logs pour en savoir plus.",
        baseUrl,
        roomId,
        accessToken,
      );
    }

    return res.status(500).json({ error: "Internal server error" });
  }

  try {
    const valeurs = await container
      .resolve("syncMbValeursUseCase")
      .execute(INDICATEURS_A_SYNCHRONISER);

    logger.info(
      {
        categorie: "sync",
        source: "cron/sync-mb-valeurs",
        metadonnees,
        valeurs,
      },
      "Synchronisation mb-valeurs terminée avec succès",
    );

    return res.status(200).json({ metadonnees, valeurs });
  } catch (error) {
    logger.error(
      { categorie: "sync", source: "cron/sync-mb-valeurs" },
      `Erreur synchronisation mb-valeurs : ${(error as Error).message}`,
    );

    if (isProd) {
      envoieMessageTchap(
        "## ⚠️ Erreur lors de la synchronisation mb-valeurs\nVeuillez regarder les logs pour en savoir plus.",
        baseUrl,
        roomId,
        accessToken,
      );
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
