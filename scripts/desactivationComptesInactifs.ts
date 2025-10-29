import { loadEnvConfig } from "@next/env";
import logger from "@/server/infrastructure/Logger";
import { getGestionUtilisateurContainer } from "@/server/gestion-utilisateur/container";
import { getInitialContainer } from "@/server/initial-container";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainer();
  const container = getGestionUtilisateurContainer(initialContainer);
  const utilisateurIAMRepository = container.resolve(
    "utilisateurIAMRepository",
  );

  // Récupérer les comptes inactifs depuis Keycloak
  logger.info("Récupération des comptes inactifs depuis Keycloak...");
  const comptesInactifs =
    await utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak();

  logger.info(`${comptesInactifs.length} comptes inactifs trouvés`);

  let comptesADesactiver = 0;
  let mailsJ7 = 0;
  let mailsJ30 = 0;

  // Parcourir les comptes inactifs et appliquer la logique
  for (const compte of comptesInactifs) {
    const { email, joursInactivite } = compte;

    if (joursInactivite > 100) {
      // Désactiver le compte
      console.log(
        `🔴 [DÉSACTIVATION] ${email} - ${joursInactivite} jours d'inactivité`,
      );
      comptesADesactiver++;
    } else if (joursInactivite === 96) {
      // Envoyer mail 7 jours avant désactivation
      console.log(
        `⚠️  [MAIL J-7] ${email} - ${joursInactivite} jours d'inactivité - Envoi mail "7 jours avant désactivation"`,
      );
      mailsJ7++;
    } else if (joursInactivite === 92) {
      // Envoyer mail 30 jours avant désactivation
      console.log(
        `⚠️  [MAIL J-30] ${email} - ${joursInactivite} jours d'inactivité - Envoi mail "30 jours avant désactivation"`,
      );
      mailsJ30++;
    }
  }

  return {
    comptesTotaux: comptesInactifs.length,
    comptesDesactives: comptesADesactiver,
    mailsEnvoyes: mailsJ7 + mailsJ30,
    detailsMails: {
      mailsJ7,
      mailsJ30,
    },
  };
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
        `   - Comptes à désactiver (> 90 jours) : ${resultat.comptesDesactives}`,
      );
      console.log(`   - Mails à envoyer : ${resultat.mailsEnvoyes}`);
      console.log(
        `     • Mails J-7 (83 jours d'inactivité) : ${resultat.detailsMails.mailsJ7}`,
      );
      console.log(
        `     • Mails J-30 (60 jours d'inactivité) : ${resultat.detailsMails.mailsJ30}`,
      );
    })
    .catch((error) => {
      logger.error(
        "Erreur lors de l'exécution du script de désactivation des comptes inactifs",
        error,
      );
    });
}
