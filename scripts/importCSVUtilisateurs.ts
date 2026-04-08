import { loadEnvConfig } from "@next/env";
import process from "node:process";
import assert from "node:assert/strict";
import logger from "@/server/infrastructure/Logger";
import UtilisateurCSVParseur from "@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur";
import { getContainer } from "@/server/dependances";

const projectDir = process.cwd();
loadEnvConfig(projectDir); // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

/**
 - Format CSV attendu:
      nom,prénom,email,profil,scope,territoires,périmètreIds,chantierIds,auteurEmail
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,lecture,REG-12,,,ditp.admin@example.com
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieCommentaire,REG-12,,,
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieIndicateur,REG-12,,,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,lecture,TOUS,,CH-001|CH-002,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieCommentaire,NAT-FR,,CH-001,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieIndicateur,TOUS,,,

 - Comment tester l'import d'un fichier CSV en local : 
      S'assurer d'avoir les variables d'env IMPORT_CLIENT_ID - IMPORT_CLIENT_SECRET - IMPORT_KEYCLOAK_URL configurées
      npx ts-node scripts/importCSVUtilisateurs.ts /chemin/fichier/local/import.csv | npx pino-pretty

 - Comment executer le script sur le serveur de prod :
      scalingo --region osc-secnum-fr1 -a prod-pilote-ditp run bash 
      export NPM_CONFIG_PRODUCTION=false
      npm ci
      vim /tmp/import.csv
      copier le contenu du CSV local dans ce fichier et sauvegarder
      npx ts-node scripts/importCSVUtilisateurs.ts /tmp/import.csv | npx pino-pretty | tee -a /tmp/import.log

  - Remarques :
      Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
      Le CSV doit contenir le même nombre de champs pour toutes les lignes, séparés par des ",".
      Si l'utilisateur est bien importé dans Keycloak, le script loggue une info (INFO) de création avec son email.
      Si un email est déjà utilisé dans Keycloak, le script loggue un warning (WARN) et ignore cet utilisateur pour Keycloak.
      Les utilisateurs existants sont remplacés et leurs droits également.

  - Compléments concernant la configuration de Keycloak :
      Créer un client dans le Realm cible, choisir le nom du client (ce sera le clientId)
      Configurer le client (onglet Settings)
          Client authentication = On
          Authorization = Off
          Authentication flow = tous Off, sauf Service accounts roles = On (active Client Credentials)
          Valid redirect URIs (à renseigner pour que les executeUserActions fonctionnent)
      Ajouter un rôle au client (onglet Service Accounts roles)
          cliquer sur Assign role
          changer le filtre en "Filter by client"
          chercher realm-admin (de realm-management) et l'assigner
          Noter le Client secret (onglet Credentials)
      Utiliser ces valeurs pour renseigner les variables d'env IMPORT_KEYCLOAK_URL - IMPORT_CLIENT_ID - IMPORT_CLIENT_SECRET
*/

async function main() {
  const filename = process.argv[2];
  assert(filename, "Nom de fichier CSV manquant");

  const container = getContainer("gestionUtilisateur");

  const contenuParsé = new UtilisateurCSVParseur(filename).parse()
    .parsedCsvRecords;

  await container.resolve("importerDesUtilisateursUseCase").run(contenuParsé);
}

const isMain = eval("require.main === module");
if (isMain) {
  main()
    .then(() => {
      logger.info({ categorie: "utilisateur", source: "importCSVUtilisateurs" }, "Import OK.");
    })
    .catch((error) => {
      logger.error({ categorie: "utilisateur", source: "importCSVUtilisateurs" }, (error as Error).message);
      throw new Error("Import échoué.", { cause: error });
    });
}
