import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdSuppressionComptes;
  const accessToken = configuration().tchap.accessToken;

  if (configuration().scalingoEnvironment !== "PROD") {
    return res.status(200).json({
      skipped: true,
      reason: "Environment is not PROD",
    });
  }

  try {
    const container = getContainer("gestionUtilisateur");

    const resultat = await container
      .resolve("supprimerLesComptesDesactivesUseCase")
      .run();

    const message = [
      "## Suppression des comptes désactivés",
      "",
      `**Comptes supprimés :** ${resultat.supprimes.length}`,
    ];

    if (resultat.erreurs.length > 0) {
      message.push(
        "",
        `**⚠️ ${resultat.erreurs.length} erreur(s) :** ${resultat.erreurs.map((erreur) => erreur.email).join(", ")}`,
      );
    }

    envoieMessageTchap(message.join("\n"), baseUrl, roomId, accessToken);

    logger.info(
      "Script de suppression des comptes désactivés terminé",
      resultat,
    );

    return res.status(200).json(resultat);
  } catch (error) {
    logger.error(
      "Erreur lors de l'exécution du cron de suppression des comptes désactivés",
      error,
    );

    const messageErreur = [
      "## ⚠️ Erreur lors de la suppression des comptes désactivés",
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");

    envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
