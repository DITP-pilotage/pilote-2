import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdDesactivationComptes;
  const accessToken = configuration().tchap.accessToken;

  if (configuration().scalingoEnvironment !== "PROD") {
    return res.status(200).json({
      skipped: true,
      reason: "Environment is not PROD",
    });
  }

  try {
    const container = getContainer("gestionUtilisateur");

    logger.info("Phase 1 : Création des actions pour les comptes inactifs");
    const resultatCreation = await container
      .resolve("creerLesActionsComptesInactifsUseCase")
      .run();
    logger.info("Phase 1 terminée", resultatCreation);

    logger.info("Phase 2 : Envoi des relances");
    const resultatRelances = await container
      .resolve("envoyerLesRelancesUseCase")
      .run();
    logger.info("Phase 2 terminée", resultatRelances);

    logger.info("Phase 3 : Désactivation des comptes");
    const resultatDesactivation = await container
      .resolve("desactiverLesComptesInactifsUseCase")
      .run();
    logger.info("Phase 3 terminée", resultatDesactivation);

    const totalErreurs =
      resultatRelances.erreurs + resultatDesactivation.erreurs;

    const message = [
      "## Désactivation des comptes inactifs",
      "",
      "**Actions créées :**",
      `* ${resultatCreation.actionsPremiereRelance} première(s) relance(s)`,
      `* ${resultatCreation.actionsDeuxiemeRelance} deuxième(s) relance(s)`,
      `* ${resultatCreation.actionsDesactivation} désactivation(s)`,
      "",
      "**Relances envoyées :**",
      `* ${resultatRelances.premieresRelancesEnvoyees} première(s) relance(s)`,
      `* ${resultatRelances.deuxiemesRelancesEnvoyees} deuxième(s) relance(s)`,
      "",
      `**Comptes désactivés :** ${resultatDesactivation.comptesDesactives}`,
    ];

    if (totalErreurs > 0) {
      message.push(
        "",
        `**⚠️ ${totalErreurs} erreur(s) :** ${resultatRelances.erreurs} relance(s), ${resultatDesactivation.erreurs} désactivation(s)`,
      );
    }

    envoieMessageTchap(message.join("\n"), baseUrl, roomId, accessToken);

    const result = {
      resultatCreation,
      resultatRelances,
      resultatDesactivation,
    };
    logger.info(
      "Script de désactivation des comptes inactifs terminé avec succès",
      result,
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      "Erreur lors de l'exécution du cron de désactivation des comptes inactifs",
      error,
    );

    const messageErreur = [
      "## ⚠️ Erreur lors de la désactivation des comptes inactifs",
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");

    envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
