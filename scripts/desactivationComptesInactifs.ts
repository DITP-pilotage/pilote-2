import { loadEnvConfig } from "@next/env";
import logger from "@/server/infrastructure/Logger";
import { getGestionUtilisateurContainer } from "@/server/gestion-utilisateur/container";
import { getInitialContainer } from "@/server/initial-container";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainer();
  const container = getGestionUtilisateurContainer(initialContainer);

  return container
    .resolve("desactiverComptesInactifsUseCase")
    .run();
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then((resultat) => {
      logger.info(
        "Script de désactivation des comptes inactifs terminé avec succès",
      );
      console.log("\n✅ Succès - Résultats :");
      console.log(`   - Comptes inactifs trouvés : ${resultat.comptesTotaux}`);
      console.log(
        `   - Comptes désactivés (> 100 jours) : ${resultat.comptesDesactives}`,
      );
      console.log(`   - Mails envoyés : ${resultat.mailsEnvoyes}`);
      console.log(
        `     • Mails J-7 (96 jours d'inactivité) : ${resultat.detailsMails.mailsJ7}`,
      );
      console.log(
        `     • Mails J-30 (92 jours d'inactivité) : ${resultat.detailsMails.mailsJ30}`,
      );
    })
    .catch((error) => {
      logger.error(
        "Erreur lors de l'exécution du script de désactivation des comptes inactifs",
        error,
      );
    });
}
