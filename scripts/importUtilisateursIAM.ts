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
// TODO: Nice to have
// [x] besoin d'une confirmation car une fois les mots de passe générés ou affichés, si on relance la machine on écrase les valeurs et on les perd ?
// [ ] comment on structure ça dans du code serveur admin ?
// [ ] changer de devDependencies en dependencies pour le client kc

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

const REALM = 'DITP';
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
  assert(records, 'CSV parsing errors: no record?');
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
    realmName: REALM,
    requestArgOptions: {},
  });

  const clientId = process.env.IMPORT_CLIENT_ID;
  const clientSecret = process.env.IMPORT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing clientId or clientSecret');
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
      realm: REALM,
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
