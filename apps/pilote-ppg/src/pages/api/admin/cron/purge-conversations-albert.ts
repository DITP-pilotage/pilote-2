import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.info(
      {
        categorie: "application-log",
        source: "cron/purge-conversations-albert",
      },
      `Purge des conversations Albert expirées`,
    );

    const result = await getContainer("albert")
      .resolve("purgerConversationsExpireesUseCase")
      .execute();

    logger.info(
      {
        categorie: "application-log",
        source: "cron/purge-conversations-albert",
        supprimees: result.supprimees,
        anterieurA: result.anterieurA.toISOString(),
      },
      `Purge terminée : ${result.supprimees} conversation(s) supprimée(s)`,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      {
        categorie: "application-log",
        source: "cron/purge-conversations-albert",
      },
      `Erreur lors de la purge des conversations : ${(error as Error).message}`,
    );

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
