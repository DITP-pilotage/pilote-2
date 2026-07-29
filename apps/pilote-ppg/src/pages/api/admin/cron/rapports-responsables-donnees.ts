import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

const querySchema = z.object({
  force: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdRapportPva;
  const accessToken = configuration().tchap.accessToken;

  const { force } = querySchema.parse(req.query);

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();

  if (
    !force &&
    (!featureFlips["NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES"] ||
      configuration().scalingoEnvironment !== "PROD")
  ) {
    return res.status(200).json({
      skipped: true,
      reason: !featureFlips["NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES"]
        ? "Feature flag NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES is disabled"
        : "Environment is not PROD",
    });
  }

  try {
    const container = getContainer("chantiers");

    logger.info(
      {
        categorie: "responsables-donnees",
        source: "cron/rapports-responsables-donnees",
      },
      "Phase 1 : Création des rapports",
    );
    const resultatCreation = await container
      .resolve("creerLesRapportsResponsablesDonneesUseCase")
      .run();
    logger.info(
      {
        categorie: "responsables-donnees",
        source: "cron/rapports-responsables-donnees",
        rapportsCrees: resultatCreation.rapportsCrees,
        erreursCreation: resultatCreation.erreursCreation,
      },
      "Phase 1 terminée",
    );

    logger.info(
      {
        categorie: "responsables-donnees",
        source: "cron/rapports-responsables-donnees",
      },
      "Phase 2 : Envoi des rapports",
    );
    const resultatEnvoi = await container
      .resolve("envoyerLesRapportsResponsablesDonneesUseCase")
      .run();
    logger.info(
      {
        categorie: "responsables-donnees",
        source: "cron/rapports-responsables-donnees",
        rapportsEnvoyes: resultatEnvoi.rapportsEnvoyes,
        rapportsEnEchec: resultatEnvoi.rapportsEnEchec,
      },
      "Phase 2 terminée",
    );

    const message = [
      "## Rapports hebdomadaires des responsables de données (CH-197)",
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
      "## ⚠️ Erreur lors de l'envoi des rapports responsables de données (CH-197)",
      "Veuillez regarder les logs pour en savoir plus :",
      `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
    ].join("\n");
    envoieMessageTchap(messageEchec, baseUrl, roomId, accessToken);
    logger.error(
      {
        categorie: "responsables-donnees",
        source: "cron/rapports-responsables-donnees",
      },
      `Erreur cron rapports responsables données : ${(error as Error).message}`,
    );

    return res
      .status(500)
      .json({ error: "Erreur lors de l'envoi des rapports" });
  }
}

export default onlyCron(handler);
