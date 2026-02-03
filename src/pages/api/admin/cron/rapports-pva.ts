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

  const initialContainer = getInitialContainerWithTransversalDependencies();
  const { emailsEnEchec } = await getChantiersContainer(initialContainer)
    .resolve("envoyerLesRapportsPropositionValeurAvancementUseCase")
    .run();

  logger.info("Envoie des rapports hebdomadaires terminé");

  const message = [
    "## Rapports hebdomadaires des propositions de valeur d'avancement",
  ];

  if (emailsEnEchec.length > 0) {
    message.push(
      `${emailsEnEchec.length} emails non envoyés :`,
      emailsEnEchec.map((email) => `* ${email}`).join("\n"),
    );
  } else {
    message.push(
      "Tous les emails ont été envoyés (l'état de réception des emails est à vérifier via les analytics dédiés)",
    );
  }

  envoieMessageTchap(message.join("\n"), baseUrl, roomId, accessToken);

  return res.status(200).json({ emailsEnEchec });
}

export default onlyCron(handler);
