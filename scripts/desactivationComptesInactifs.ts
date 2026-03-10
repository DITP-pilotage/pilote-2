import { loadEnvConfig } from "@next/env";
import process from "node:process";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { getContainer } from "@/server/dependances";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
const baseUrl = process.env.TCHAP_BASE_URL ?? "";
const roomId = process.env.TCHAP_ROOM_ID_DESACTIVATION_COMPTES ?? "";
const accessToken = process.env.TCHAP_ACCESS_TOKEN ?? "";

async function main() {
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

  return { resultatCreation, resultatRelances, resultatDesactivation };
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(({ resultatCreation, resultatRelances, resultatDesactivation }) => {
      logger.info(
        "Script de désactivation des comptes inactifs terminé avec succès",
      );

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
    })
    .catch((error) => {
      logger.error(
        "Erreur lors de l'exécution du script de désactivation des comptes inactifs",
        error,
      );

      const messageErreur = [
        "## ⚠️ Erreur lors de la désactivation des comptes inactifs",
        "Veuillez regarder les logs pour en savoir plus :",
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join("\n");

      envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);
    });
}
