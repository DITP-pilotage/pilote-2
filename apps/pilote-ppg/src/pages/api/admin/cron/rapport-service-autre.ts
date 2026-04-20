import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdRapportServiceAutre;
  const accessToken = configuration().tchap.accessToken;
  const isProd = configuration().scalingoEnvironment === "PROD";

  try {
    const prisma = getContainer("shared").resolve("prisma");

    logger.info(
      { categorie: "rapport", source: "cron/rapport-service-autre" },
      "Récupération des utilisateurs avec service_autre",
    );

    const utilisateurs = await prisma.getInstance().utilisateur.findMany({
      where: { service_autre: { not: null } },
      select: { service_autre: true },
    });

    const count = utilisateurs.length;
    const valeursDistinctes = [
      ...new Set(
        utilisateurs
          .map((u) => u.service_autre)
          .filter((s): s is string => s !== null),
      ),
    ].sort();

    logger.info(
      {
        categorie: "rapport",
        source: "cron/rapport-service-autre",
        count,
        nombreValeursDistinctes: valeursDistinctes.length,
      },
      "Données service_autre récupérées",
    );

    const message = [
      '## Rapport hebdomadaire des services "autre"',
      "",
      `**Nombre d'utilisateurs avec un service "autre" :** ${count}`,
      "",
      "**Liste des valeurs distinctes :**",
      ...valeursDistinctes.map((valeur) => `* ${valeur}`),
    ].join("\n");

    if (isProd) {
      envoieMessageTchap(message, baseUrl, roomId, accessToken);
    }

    const result = { count, valeursDistinctes };
    logger.info(
      { categorie: "rapport", source: "cron/rapport-service-autre", count },
      'Rapport hebdomadaire des services "autre" envoyé avec succès',
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      { categorie: "rapport", source: "cron/rapport-service-autre" },
      `Erreur cron rapport services "autre" : ${(error as Error).message}`,
    );

    const messageErreur = [
      '## ⚠️ Erreur lors du rapport hebdomadaire des services "autre"',
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");

    if (isProd) {
      envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
