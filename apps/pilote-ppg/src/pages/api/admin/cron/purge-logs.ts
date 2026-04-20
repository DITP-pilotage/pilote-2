import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const anterieurA = new Date();
  anterieurA.setDate(anterieurA.getDate() - 30);

  try {
    logger.info(
      { categorie: "application-log", source: "cron/purge-logs" },
      `Purge des logs antérieurs au ${anterieurA.toISOString()}`,
    );

    const result = await getContainer("applicationLog")
      .resolve("purgerLogsUseCase")
      .execute({ anterieurA });

    logger.info(
      {
        categorie: "application-log",
        source: "cron/purge-logs",
        ...result,
      },
      `Purge terminée : ${result.nombreSupprime} log(s) supprimé(s)`,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      { categorie: "application-log", source: "cron/purge-logs" },
      `Erreur lors de la purge des logs : ${(error as Error).message}`,
    );

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
