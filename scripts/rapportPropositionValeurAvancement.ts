import { loadEnvConfig } from "@next/env";
import process from "node:process";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";
import { getChantiersContainer } from "@/server/chantiers/container";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID_RAPPORT_PVA ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";
async function main() {
  const initialContainer = getInitialContainerWithTransversalDependencies();
  const { emailsEnEchec } = await getChantiersContainer(initialContainer)
    .resolve("envoyerLesRapportsPropositionValeurAvancementUseCase")
    .run();
  return emailsEnEchec;
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(async (emailsEnEchec) => {
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
    })
    .catch((error) => {
      const messageEchecSuppression = [
        "## ⚠️ Erreur lors de l'envoie des rapports de propositions de valeur d'avancement",
        "Veuillez regarder les logs pour en savoir plus :",
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join("\n");
      envoieMessageTchap(messageEchecSuppression, baseUrl, roomId, accessToken);
      logger.error(error);
    });
}
