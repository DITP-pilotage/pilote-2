import { loadEnvConfig } from "@next/env";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";

async function main() {
  return getContainer("gestionUtilisateur")
    .resolve("supprimerLesComptesDesactivesUseCase")
    .run();
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(async (utilisateursSupprimes) => {
      logger.info("Suppression des utilisateurs terminée");
      const messageSuccesSuppression = [
        "## Rapport hebdomadaire de la suppression des utilisateurs :",
        `${utilisateursSupprimes.length} utilisateurs supprimés :`,
        utilisateursSupprimes
          .map((utilisateur) => `* ${utilisateur.email}`)
          .join("\n"),
      ].join("\n");
      envoieMessageTchap(
        messageSuccesSuppression,
        baseUrl,
        roomId,
        accessToken,
      );
    })
    .catch((error) => {
      const messageEchecSuppression = [
        "## ⚠️ Erreur lors de la suppression des utilisateurs",
        "Veuillez regarder les logs pour en savoir plus :",
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join("\n");
      envoieMessageTchap(messageEchecSuppression, baseUrl, roomId, accessToken);
      logger.error(error);
    });
}
