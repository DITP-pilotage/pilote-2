import "./load-env";
import { loadEnvConfig } from "@next/env";
import process from "node:process";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";
import { CreerLesRapportsPropositionsResultat } from "@/server/chantiers/usecases/CreerLesRapportsPropositionsUseCase";
import { EnvoyerLesRapportsPropositionsResultat } from "@/server/chantiers/usecases/EnvoyerLesRapportsPropositionsUseCase";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID_RAPPORT_PVA ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";

interface ResultatRapportPVA {
  resultatCreation: CreerLesRapportsPropositionsResultat;
  resultatEnvoi: EnvoyerLesRapportsPropositionsResultat;
}

async function main(): Promise<ResultatRapportPVA> {
  const container = getContainer("chantiers");

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

  return { resultatCreation, resultatEnvoi };
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(async ({ resultatCreation, resultatEnvoi }) => {
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
    })
    .catch((error) => {
      const messageEchecSuppression = [
        "## ⚠️ Erreur lors de l'envoi des rapports de propositions de valeur d'avancement",
        "Veuillez regarder les logs pour en savoir plus :",
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join("\n");
      envoieMessageTchap(messageEchecSuppression, baseUrl, roomId, accessToken);
      logger.error(error);
    });
}
