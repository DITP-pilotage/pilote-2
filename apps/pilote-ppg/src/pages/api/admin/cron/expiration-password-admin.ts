import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

const SOURCE = "cron/expiration-password-admin";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = configuration();
  const baseUrl = config.tchap.baseUrl;
  const roomId = config.tchap.roomIdDesactivationComptes;
  const accessToken = config.tchap.accessToken;

  if (config.scalingoEnvironment !== "PROD") {
    return res.status(200).json({
      skipped: true,
      reason: "Environment is not PROD",
    });
  }

  // Flip lu via le registre admin (env + override en base) pour pouvoir couper
  // le mécanisme sans redéploiement.
  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  if (!featureFlips["NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN"]) {
    return res.status(200).json({
      skipped: true,
      reason:
        "Feature flag NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN is disabled",
    });
  }

  try {
    const container = getContainer("gestionUtilisateur");

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 1 : Synchronisation des suivis de mot de passe depuis Keycloak",
    );
    const resultatSynchronisation = await container
      .resolve("synchroniserLesSuivisPasswordAdminUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatSynchronisation },
      "Phase 1 terminée",
    );

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 2 : Création des actions de relance et d'expiration",
    );
    const resultatCreation = await container
      .resolve("creerLesActionsPasswordUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatCreation },
      "Phase 2 terminée",
    );

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 3 : Exécution des actions",
    );
    const resultatExecution = await container
      .resolve("executerLesActionsPasswordUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatExecution },
      "Phase 3 terminée",
    );

    const totalErreurs =
      resultatSynchronisation.erreurs + resultatExecution.erreurs;

    if (totalErreurs > 0) {
      const message = [
        "## ⚠️ Expiration des mots de passe DITP_ADMIN",
        "",
        `**${totalErreurs} erreur(s) :** ${resultatSynchronisation.erreurs} synchronisation(s), ${resultatExecution.erreurs} action(s)`,
        "Veuillez regarder les logs pour en savoir plus.",
      ].join("\n");
      envoieMessageTchap(message, baseUrl, roomId, accessToken);
    }

    const result = {
      resultatSynchronisation,
      resultatCreation,
      resultatExecution,
    };
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...result },
      "Script d'expiration des mots de passe terminé avec succès",
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      { categorie: "utilisateur", source: SOURCE },
      `Erreur lors de l'exécution du cron d'expiration des mots de passe : ${(error as Error).message}`,
    );

    const messageErreur = [
      "## ⚠️ Erreur lors de l'expiration des mots de passe DITP_ADMIN",
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");
    envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
