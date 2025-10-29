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
  const contactInfoLettresService = container.resolve(
    "contactInfoLettresService",
  );
  const utilisateurRepository = container.resolve("utilisateurRepository");
  const tokenAPIInformationRepository = container.resolve(
    "tokenAPIInformationRepository",
  );

  const auteurIdSysteme = await utilisateurRepository.recupererUtilisateurId(
    "import.csv@modernisation.gouv.fr",
  );

  if (!auteurIdSysteme) {
    throw new Error(
      `L'utilisateur système n'existe pas. Veuillez créer cet utilisateur avant d'exécuter ce script.`,
    );
  }

  const comptesInactifs =
    await utilisateurIAMRepository.recupererComptesInactifsDepuisKeycloak();

  logger.info(`${comptesInactifs.length} comptes inactifs trouvés`);

  let comptesDesactives = 0;
  let mailsJ7 = 0;
  let mailsJ30 = 0;

  // Parcourir les comptes inactifs et appliquer la logique
  for (const compte of comptesInactifs) {
    const { email, joursInactivite } = compte;

    if (joursInactivite > 100) {
      logger.info(
        `Désactivation du compte ${email} (${joursInactivite} jours d'inactivité)`,
      );

      await utilisateurRepository.desactiver(email, auteurIdSysteme);

      if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === "true") {
        await contactInfoLettresService.supprimerContact(email);
      }

      if (process.env.IMPORT_KEYCLOAK_URL) {
        await utilisateurIAMRepository.desactive(email);
      }

      await tokenAPIInformationRepository.supprimerTokenAPIInformation({
        email,
      });

      comptesDesactives++;
    } else if (joursInactivite === 96) {
      // await contactInfoLettresService.envoieUnEmail([{ email }], 39, {
      //   joursAvantDesactivation: 7,
      // });
      logger.info(`Mail J-7 envoyé à ${email}`);
      mailsJ7++;
    } else if (joursInactivite === 92) {
      // await contactInfoLettresService.envoieUnEmail([{ email }], 39, {
      //   joursAvantDesactivation: 30,
      // });
      logger.info(`Mail J-30 envoyé à ${email}`);
      mailsJ30++;
    }
  }

  return {
    comptesTotaux: comptesInactifs.length,
    comptesDesactives,
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
