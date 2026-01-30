import { loadEnvConfig } from "@next/env";
import logger from "@/server/infrastructure/Logger";
import { getGestionUtilisateurContainer } from "@/server/gestion-utilisateur/container";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainerWithTransversalDependencies();
  const container = getGestionUtilisateurContainer(initialContainer);

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
      logger.info("\n✅ Succès - Résultats :");
      logger.info(
        `   - Actions créées : ${resultatCreation.actionsPremiereRelance} première(s) relance(s), ${resultatCreation.actionsDeuxiemeRelance} deuxième(s) relance(s), ${resultatCreation.actionsDesactivation} désactivation(s)`,
      );
      logger.info(
        `   - Relances envoyées : ${resultatRelances.premieresRelancesEnvoyees} première(s), ${resultatRelances.deuxiemesRelancesEnvoyees} deuxième(s), ${resultatRelances.erreurs} erreur(s)`,
      );
      logger.info(
        `   - Comptes désactivés : ${resultatDesactivation.comptesDesactives}, ${resultatDesactivation.erreurs} erreur(s)`,
      );
    })
    .catch((error) => {
      logger.error(
        "Erreur lors de l'exécution du script de désactivation des comptes inactifs",
        error,
      );
    });
}
