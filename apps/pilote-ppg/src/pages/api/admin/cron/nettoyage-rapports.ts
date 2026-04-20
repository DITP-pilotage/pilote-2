import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const container = getContainer("albert");
  const rapportFileStorage = container.resolve("rapportFileStorage");

  const deleted =
    await rapportFileStorage.deleteOlderThan(TWENTY_FOUR_HOURS_MS);

  logger.info({ deleted }, "Nettoyage des rapports exportés terminé");

  res.status(200).json({ deleted });
}

export default onlyCron(handler);
