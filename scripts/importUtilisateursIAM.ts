import { loadEnvConfig } from '@next/env';
import process from 'node:process';
import assert from 'node:assert/strict';

const projectDir = process.cwd();
loadEnvConfig(projectDir);  // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

import logger from '@/server/infrastructure/logger';
import parseUtilisateursCsv from '@/server/infrastructure/import_csv/identité/parseUtilisateursCsv';
import ImporterUtilisateursUseCase from '@/server/usecase/identité/ImporterUtilisateursUseCase';

/**
 * Exemple de CSV :
 *
 * Nom,Prénom,E-mail,Profils,Nom du chantier,ID du chantier
 * Roccaserra,Sébastien,coincoin_sro@octo.com,profil toto,chantier toto,CH-5678
 * Drant,Yannick,coincoin_ydr@octo.com,Profil yo,chantier yo,CH-1234
 *
 * Exemple d'usage :
 *
 * $ npx ts-node scripts/importUtilisateursIAM.ts /tmp/import.csv | npx pino-pretty | tee -a /tmp/import.log
 *
 * Règles pour le CSV & comportement du script
 *
 * - Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
 * - Le CSV doit contenir le même nombre de champs pour toutes les lignes, séparés par des ",".
 * - Lors d'un ajout réussi de l'utilisateur dans Keycloak, son mot de passe temporaire généré aparaît dans les logs.
 * - Si l'utilisateur est bien importé dans Keycloak, le script loggue une info (INFO) de création avec son email et son
 *   mot de passe temporaire généré
 * - Si un email est déjà utilisé dans Keycloak, le script loggue un warning (WARN) et ignore cet utilisateur pour
 *   Keycloak.
 * - Ensuite les utilisateurs sont importés dans Pilote, les utilisateurs existants sont remplacés.
 *
 * Prérequis = Création de client dans l'admin Keycloak & variables d'env
 *
 * - Créer un client dans le Realm cible, choisir le nom du client (ce sera le clientId)
 * - Configurer le client (onglet Settings)
 *     - Client authentication = On
 *     - Authorization = Off
 *     - Authentication flow = tous Off, sauf Service accounts roles = On (active Client Credentials)
 *     - Valid redirect URIs (à renseigner pour que les executeUserActions fonctionnent)
 * - Ajouter un rôle au client (onglet Service Accounts roles)
 *     - cliquer sur Assign role
 *     - changer le filtre en "Filter by client"
 *     - chercher realm-admin (de realm-management) et l'assigner
 * - Noter le Client secret (onglet Credentials)
 * - Dans son .env, ajouter IMPORT_KEYCLOAK_URL, l'url de base du Keycloak cible
 * - Dans son .env, ajouter IMPORT_CLIENT_ID avec le clientId
 * - Dans son .env, ajouter IMPORT_CLIENT_SECRET avec le client
 * - Si besoin d'importer les seeds sur un one-off, prévoir une taille L (`run --size L`)
 * - Sur un one-off, ajouter les devDependencies :
 *     export NPM_CONFIG_PRODUCTION=false
 *     npm ci
 *
 * Troubleshooting
 *
 * - Quand le mot de passe généré ne satisfait pas les règles configurées sur Keycloak (longueur, caractères, etc.) dans
 *   le menu "Authentication", onglet "Policies", alors l'API client admin Keycloak renvoit un code 400 bad request.
 *   => Si vous avez une erreur 400, vérifiez si le mot de passe temporaire généré satisfait les règles configurées.
 *
 * Références :
 *
 * - API admin Keycloak ~ https://www.keycloak.org/docs-api/21.0.0/rest-api/index.html
 * - keycloak-admin-client ~ https://github.com/keycloak/keycloak/tree/main/js/libs/keycloak-admin-client
 * - ex de setup client ~ https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs#keycloak-setup
 */

async function main() {
  const filename = process.argv[2];
  assert(filename, 'Nom de fichier CSV manquant');
  const utilisateursPourImport = parseUtilisateursCsv(filename);
  const usecase = new ImporterUtilisateursUseCase();
  await usecase.run(utilisateursPourImport);
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Import OK.');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error('Import échoué.', { cause: error });
    });
}
