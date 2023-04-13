/* eslint-disable import/no-extraneous-dependencies */
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker/locale/fr';
import process from 'node:process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/logger';

// TODO: Must have
// [x] installer le client keycloak
// [x] créer le client keycloak sur dev-keycloak
// [x] faire un get sur l'api keycloak
// [x] faire fonctionner en ts ? abandonner le ts ?
// [x] type: module = c'est quoi les conséquences ? on garde ? on jette ?
// [x] faire un post pour créer un utilisateurs
// [x] pouvoir lire les données dans un csv (quelle lib ?)
// [x] quel format csv ?
// [x] faire le ou les posts pour créer les utilisateurs
// [x] générer les mots de passe temporaires
// [x] écrire les mots de passe temporaires dans un log ou csv ou stdout pour pouvoir les communiquer
//     autre option au début du traitement :
//         - si l'entête du csv ne contient pas le champs 'Mot de passe', ajouter cette colonne et ré-écrire le csv source
//         - sinon ne rien faire
//         - poursuivre le traitement
// [x] ajouter l'action 'doit reset son mot de passe' à la création de l'utilisateur
// [x] documenter
// [ ] créer les utilisateurs dans l'app avec leur liste de chantiers
// [ ] réfléchir 2 s à la gestion d'erreurs
// [ ] supprimer version .mjs
// TODO: Nice to have
// [x] besoin d'une confirmation car une fois les mots de passe générés ou affichés, si on relance la machine on écrase les valeurs et on les perd ?
// [ ] envoie d'email aux utilisateurs créés ?
// [ ] ajouter une colonne status (utilisateur créé, utilisateur non créé, etc.) dans le csv à l'issu du script ?
// [ ] comment on structure ça dans du code serveur admin ?
// [ ] changer de devDependencies en dependencies pour le client kc

/**
 * Exemple de CSV :
 *
 * Nom,Prénom,E-mail,Profils,Nom du chantier,ID du chantier
 * Roccaserra,Sébastien,coincoin_sro@octo.com,profil toto,chantier toto,CH-5678
 * Drant,Yannick,coincoin_ydr@octo.com,Profil yo,chantier yo,CH-1234
 *
 * Exemple d'usage :
 *
 * $ npx ts-node scripts/importUtilisateursIAM.ts buid/test.csv | npx pino-pretty
 *
 * Règles pour le CSV & comportement du script
 *
 * - Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
 * - Le CSV doit contenir le même nombre de champs pour toutes les lignes, séparés par des ",".
 * - S'il n'y a pas de colonne 'Mot de passe' dans le CSV, le script l'ajoute et génère des mots de passe.
 * - S'il y a une colonne 'Mot de passe' dans le CSV, celle-ci reste inchangée.
 * - Si un email est déjà utilisé dans Keycloak, le script loggue un warning (WARN) et ignore cet utilisateur. Un mot de
 *   passe est peut-être généré pour lui (condition ci-dessus) mais pas utilisé.
 * - Si l'utilisateur est bien importé dans Keycloak, le script loggue une info (INFO) de création.
 *
 * Prérequis = Création de client dans l'admin Keycloak & variables d'env
 *
 * - Créer un client dans le Realm cible, choisir le nom du client (ce sera le clientId)
 * - Configurer le client (onglet Settings)
 *     - Client authentication = On
 *     - Authorization = Off
 *     - Authentication flow = tous Off, sauf Service accounts roles = On (active Client Credentials)
 * - Ajouter un rôle au client (onglet Service Accounts roles)
 *     - cliquer sur Assign role, chercher realm-admin (de realm-management) et l'assigner
 * - Noter le Client secret (onglet Credentials)
 * - Dans son .env, ajouter IMPORT_CLIENT_ID avec le clientId
 * - Dans son .env, ajouter IMPORT_CLIENT_SECRET avec le client secret
 *
 * Références :
 *
 * - API admin Keycloak ~ https://www.keycloak.org/docs-api/21.0.0/rest-api/index.html
 * - keycloak-admin-client ~ https://github.com/keycloak/keycloak/tree/main/js/libs/keycloak-admin-client
 * - ex de setup client ~ https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs#keycloak-setup
 */

dotenv.config();

const CSV_PARSE_OPTIONS = {
  columns: true,
  skipEmptyLines: true,
};

const CSV_WRITE_OPTIONS = {
  header:true,
};

const FIELDS = {
  nom: 'Nom',
  prénom: 'Prénom',
  email: 'E-mail',
  profils: 'Profils',
  nomChantier: 'Nom du chantier',
  idChantier: 'ID du chantier',
  motDePasse: 'Mot de passe',
};
const EXPECTED_RECORD_FIELDS = Object.values(FIELDS);

const KEYCLOAK_REALM = 'DITP';
const KEYCLOAK_URL = 'https://dev-keycloak-ditp.osc-fr1.scalingo.io';

type CsvRecord = Record<string, string>;

function contientMotsDePasse(records: CsvRecord[]) {
  const firstRecord = records[0];
  return Boolean(firstRecord[FIELDS.motDePasse]);
}

function générerEtÉcrireMotsDePasse(records: CsvRecord[], filename: string) {
  for (const record of records) {
    assert(!record[FIELDS.motDePasse]);
    // ex. de mot de passe généré : JHqVoxOoHnGLbhR
    record[FIELDS.motDePasse] = faker.internet.password(15, false, /\w/, '');
  }
  const contents = stringify(records, CSV_WRITE_OPTIONS);
  fs.writeFileSync(filename, contents);
}

function checkRecords(records: CsvRecord[]) {
  assert(records, 'Erreur de parsing CSV. Pas de lignes ?');
  let lineNb = 0;
  for (const record of records) {
    lineNb += 1;
    for (const field of EXPECTED_RECORD_FIELDS) {
      assert(record[field], `Erreur de parsing CSV ligne: ${lineNb}. Mauvais header ?`);
    }
  }
}

// Oups?! Voir : https://github.com/TypeStrong/ts-node/discussions/1290
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)');

async function loginKcAdminClient() {
  const { default: KcAdminClient } = await dynamicImport('@keycloak/keycloak-admin-client');
  const kcAdminClient = new KcAdminClient({
    baseUrl: KEYCLOAK_URL,
    realmName: KEYCLOAK_REALM,
    requestArgOptions: {},
  });

  const clientId = process.env.IMPORT_CLIENT_ID;
  const clientSecret = process.env.IMPORT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Variable d\'env IMPORT_CLIENT_ID ou IMPORT_CLIENT_SECRET manquante.');
  }

  await kcAdminClient.auth({
    grantType: 'client_credentials',
    clientId,
    clientSecret,
  });

  return kcAdminClient;
}

async function importeUtilisateur(kcAdminClient: any, record: CsvRecord) {
  const email = record[FIELDS.email];
  const passwordCred = { temporary: true, type: 'password', value: record[FIELDS.motDePasse] };
  try {
    await kcAdminClient.users.create({
      realm: KEYCLOAK_REALM,
      username: email,
      email,
      firstName: record[FIELDS.prénom],
      lastName: record[FIELDS.nom],
      enabled: true,
      requiredActions: ['UPDATE_PASSWORD'],
      credentials: [passwordCred],
    });
    logger.info(`Utilisateur ${email} créé.`);
  } catch (error: any) {
    if (error.message == 'Request failed with status code 409') {
      logger.warn(`L'email ${email} existe déjà.`);
    } else {
      logger.error(error);
      throw error;
    }
  }
}



async function main() {
  const filename = process.argv[2];
  assert(filename, 'Nom de fichier CSV manquant');

  const contents = fs.readFileSync(filename, 'utf8');
  const records: CsvRecord[] = parse(contents, CSV_PARSE_OPTIONS);

  if (!contientMotsDePasse(records)) {
    générerEtÉcrireMotsDePasse(records, filename);
  }

  checkRecords(records);

  const kcAdminClient = await loginKcAdminClient();
  for (const record of records) {
    await importeUtilisateur(kcAdminClient, record);
  }
}

main().catch((error) => {
  logger.error(error);
});
