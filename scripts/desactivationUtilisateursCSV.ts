import { loadEnvConfig } from "@next/env";
import process from "node:process";
import assert from "node:assert/strict";
import logger from "@/server/infrastructure/Logger";
import UtilisateurCSVParseur from "@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur";
import { getInitialContainerWithTransversalDependencies } from "@/server/InitialDependencies";
import { getGestionUtilisateurContainer } from "@/server/gestion-utilisateur/container";

const projectDir = process.cwd();
loadEnvConfig(projectDir); // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

async function main() {
  const filename = process.argv[2];
  assert(filename, "Nom de fichier CSV manquant");

  const initialContainer = getInitialContainerWithTransversalDependencies();
  const container = getGestionUtilisateurContainer(initialContainer);
  const utilisateurIAMRepository = container.resolve(
    "utilisateurIAMRepository",
  );
  const utilisateurRepository = container.resolve("utilisateurRepository");
  const chantierRepository = container.resolve("chantierRepository");
  const territoireRepository = container.resolve("territoireRepository");
  const perimetreMinisterielRepository = container.resolve(
    "perimetreMinisterielRepository",
  );
  const tokenAPIInformationRepository = container.resolve(
    "tokenAPIInformationRepository",
  );
  const contactInfoLettresService = container.resolve(
    "contactInfoLettresService",
  );

  const listeInformationsChantiersUtilisateurs =
    await chantierRepository.listerInformationsChantiersUtilisateurs();
  const listeTerritoiresCodes = await territoireRepository.listerCodes([]);
  const listePerimetresMinisteriels =
    await perimetreMinisterielRepository.listerIds([]);

  const auteurGenerique = await utilisateurRepository.récupérer(
    "import.csv@modernisation.gouv.fr",
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  );

  if (!auteurGenerique) {
    throw new Error("Auteur générique introuvable");
  }

  const emailsADesactiver = new UtilisateurCSVParseur(
    filename,
  ).parseComptesADesactiver();
  for (const email of emailsADesactiver) {
    logger.info(`Désactivation du compte: ${email}`);
    await utilisateurRepository.desactiver(email, auteurGenerique.id);

    if (process.env.NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO === "true") {
      await contactInfoLettresService.supprimerContact(email);
    }

    if (process.env.IMPORT_KEYCLOAK_URL) {
      await utilisateurIAMRepository.desactive(email);
    }

    await tokenAPIInformationRepository.supprimerTokenAPIInformation({
      email,
    });
  }
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(() => {
      logger.info("Désactivation OK.");
    })
    .catch((error) => {
      logger.error(error);
      throw new Error("Désactivation échouée.", { cause: error });
    });
}
