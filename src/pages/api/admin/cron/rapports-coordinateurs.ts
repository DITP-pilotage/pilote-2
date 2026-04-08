import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration, configurationFeatureFlip } from "@/config";

const querySchema = z.object({
  date: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return new Date();
      const parsed = Date.parse(val);
      return Number.isNaN(parsed) ? new Date() : new Date(parsed);
    }),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = configuration().tchap.baseUrl;
  const roomId = configuration().tchap.roomIdRapportCoordinateurs;
  const accessToken = configuration().tchap.accessToken;

  if (
    !configurationFeatureFlip().rapportCoordinateurs ||
    configuration().scalingoEnvironment !== "PROD"
  ) {
    return res.status(200).json({
      skipped: true,
      reason: !configurationFeatureFlip().rapportCoordinateurs
        ? "Feature flag NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS is disabled"
        : "Environment is not PROD",
    });
  }

  const { date: maintenant } = querySchema.parse(req.query);

  logger.info(
    {
      categorie: "rapport",
      source: "cron/rapports-coordinateurs",
      dateExecution: maintenant.toISOString(),
    },
    "Génération des rapports hebdomadaires",
  );

  const container = getContainer("rapportsHebdomadaires");

  const produireUseCase = container.resolve(
    "produireRapportsHebdomadairesUseCase",
  );
  const resultProduction = await produireUseCase.run({ maintenant });

  const messagePhase1 = [
    "## 📊 Rapports hebdomadaires coordinateurs - Phase 1 : Production",
    "",
    `✅ **${resultProduction.rapportsCrees} rapports créés** et persistés en base`,
  ].join("\n");

  envoieMessageTchap(messagePhase1, baseUrl, roomId, accessToken);

  const envoyerUseCase = container.resolve(
    "envoyerRapportsHebdomadairesUseCase",
  );
  const resultEnvoi = await envoyerUseCase.run({
    dateCreationMin: resultProduction.dateExecution,
  });

  const messagePhase2Lines = [
    "## 📧 Rapports hebdomadaires coordinateurs - Phase 2 : Envoi",
    "",
    `✅ **${resultEnvoi.emailsEnvoyes} emails envoyés avec succès**`,
  ];

  if (resultEnvoi.emailsEnEchec > 0) {
    messagePhase2Lines.push(
      `❌ **${resultEnvoi.emailsEnEchec} emails en échec** :`,
    );
    for (const erreur of resultEnvoi.erreursDetails) {
      messagePhase2Lines.push(`* ${erreur.email} - ${erreur.erreur}`);
    }
    messagePhase2Lines.push(
      "",
      "Les rapports en échec restent en statut ECHEC et peuvent être renvoyés manuellement.",
    );
  }

  envoieMessageTchap(
    messagePhase2Lines.join("\n"),
    baseUrl,
    roomId,
    accessToken,
  );

  const result = { production: resultProduction, envoi: resultEnvoi };
  logger.info(
    {
      categorie: "rapport",
      source: "cron/rapports-coordinateurs",
      rapportsCrees: result.production.rapportsCrees,
      emailsEnvoyes: result.envoi.emailsEnvoyes,
    },
    "Exécution terminée",
  );

  return res.status(200).json(result);
}

export default onlyCron(handler);
