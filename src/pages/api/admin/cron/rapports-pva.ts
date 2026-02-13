import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";
import { getChantiersContainer } from "@/server/chantiers/container";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration, configurationFeatureFlip } from "@/config";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdRapportPva;
  const accessToken = configuration().tchap.accessToken;

  if (
    !configurationFeatureFlip().rapportPva ||
    configuration().scalingoEnvironment !== "PROD"
  ) {
    return res.status(200).json({
      skipped: true,
      reason: !configurationFeatureFlip().rapportPva
        ? "Feature flag NEXT_PUBLIC_FF_RAPPORT_PVA is disabled"
        : "Environment is not PROD",
    });
  }

  try {
    const initialContainer = getInitialContainerWithTransversalDependencies();
    const container = getChantiersContainer(initialContainer);

    logger.info("Phase 1 : Création des rapports");
    const resultatCreation = await container
      .resolve("creerLesRapportsPropositionsUseCase")
      .run();
    logger.info("Phase 1 terminée", resultatCreation);

    logger.info("Phase 2 : Envoi des rapports");
    const resultatEnvoi = await container
      .resolve("envoyerLesRapportsPropositionsUseCase")
      .run();
    logger.info("Phase 2 terminée", resultatEnvoi);

    logger.info("Envoi des rapports hebdomadaires terminé");

    const message = [
      "## Rapports hebdomadaires des propositions de valeur d'avancement",
      "",
      `**Phase 1 - Création :** ${resultatCreation.rapportsCrees} rapports créés, ${resultatCreation.erreursCreation} erreurs`,
      `**Phase 2 - Envoi :** ${resultatEnvoi.rapportsEnvoyes} rapports envoyés, ${resultatEnvoi.rapportsEnEchec} échecs`,
    ];

    if (resultatEnvoi.emailsEnEchec.length > 0) {
      message.push(
        "",
        `${resultatEnvoi.emailsEnEchec.length} emails non envoyés :`,
        resultatEnvoi.emailsEnEchec.map((email) => `* ${email}`).join("\n"),
      );
    } else {
      message.push(
        "",
        "Tous les emails ont été envoyés (l'état de réception des emails est à vérifier via les analytics dédiés)",
      );
    }

    envoieMessageTchap(message.join("\n"), baseUrl, roomId, accessToken);

    return res.status(200).json({ resultatCreation, resultatEnvoi });
  } catch (error) {
    const messageEchec = [
      "## ⚠️ Erreur lors de l'envoi des rapports de propositions de valeur d'avancement",
      "Veuillez regarder les logs pour en savoir plus :",
      `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
    ].join("\n");
    envoieMessageTchap(messageEchec, baseUrl, roomId, accessToken);
    logger.error(error);

    return res
      .status(500)
      .json({ error: "Erreur lors de l'envoi des rapports" });
  }
}

export default onlyCron(handler);
