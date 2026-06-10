import type { NextApiRequest, NextApiResponse } from "next";

import { configuration } from "@/config";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";
import { type SyncMetadonneesResultat } from "@/server/mb-sync/usecases/SyncMbMetadonneesUseCase";
import { type SyncObjectifsResultat } from "@/server/mb-sync/usecases/SyncMbObjectifsUseCase";
import { type SyncResultat } from "@/server/mb-sync/usecases/SyncMbValeursUseCase";

const INDICATEURS_A_SYNCHRONISER = [
  "IND-510",
  "IND-513",
  "IND-312",
  "IND-511",
  "IND-679",
  "IND-587",
  "IND-867",
  "IND-600",
  "IND-292",
  "IND-316",
  "IND-303",
  "IND-387",
  "IND-369",
  "IND-409",
  "IND-412",
  "IND-246",
  "IND-323",
  "IND-699",
  "IND-691",
  "IND-315",
  "IND-996",
  "IND-291",
  "IND-411",
  "IND-536",
  "IND-533",
  "IND-343",
  "IND-739",
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    baseUrl,
    roomIdSyncMbValeurs: roomId,
    accessToken,
  } = configuration().tchap;
  const isProd = configuration().scalingoEnvironment === "PROD";

  const container = getContainer("mbSync");

  let metadonnees: SyncMetadonneesResultat;
  let valeurs: SyncResultat;
  let objectifs: SyncObjectifsResultat;

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
    valeurs = await container
      .resolve("syncMbValeursUseCase")
      .execute(INDICATEURS_A_SYNCHRONISER);
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

  try {
    objectifs = await container
      .resolve("syncMbObjectifsUseCase")
      .execute(INDICATEURS_A_SYNCHRONISER);

    logger.info(
      {
        categorie: "sync",
        source: "cron/sync-mb-valeurs",
        metadonnees,
        valeurs,
        objectifs,
      },
      "Synchronisation mb-objectifs terminée avec succès",
    );

    return res.status(200).json({ metadonnees, valeurs, objectifs });
  } catch (error) {
    logger.error(
      { categorie: "sync", source: "cron/sync-mb-valeurs" },
      `Erreur synchronisation mb-objectifs : ${(error as Error).message}`,
    );

    if (isProd) {
      envoieMessageTchap(
        "## ⚠️ Erreur lors de la synchronisation mb-objectifs\nVeuillez regarder les logs pour en savoir plus.",
        baseUrl,
        roomId,
        accessToken,
      );
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
