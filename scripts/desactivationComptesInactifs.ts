import { loadEnvConfig } from "@next/env";
import logger from "@/server/infrastructure/Logger";
import { getGestionUtilisateurContainer } from "@/server/gestion-utilisateur/container";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainerWithTransversalDependencies();
  const container = getGestionUtilisateurContainer(initialContainer);

  return container.resolve("desactiverComptesInactifsUseCase").run();
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then((resultat) => {
      logger.info(
        "Script de désactivation des comptes inactifs terminé avec succès",
      );
      logger.info("\n✅ Succès - Résultats :");
      logger.info(`   - Comptes inactifs trouvés : ${resultat.comptesTotaux}`);
      logger.info(`   - Comptes désactivés : ${resultat.comptesDesactives}`);
      logger.info(
        `   - Mails J-7 (96 jours d'inactivité) : ${resultat.detailsMails.mailsJ7}`,
      );
      logger.info(
        `   - Mails J-30 (92 jours d'inactivité) : ${resultat.detailsMails.mailsJ30}`,
      );
    })
    .catch((error) => {
      logger.error(
        "Erreur lors de l'exécution du script de désactivation des comptes inactifs",
        error,
      );
    });
}
