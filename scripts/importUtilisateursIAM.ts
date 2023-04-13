/* eslint-disable import/no-extraneous-dependencies */
import { parse } from 'csv-parse/sync';
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
// [ ] écrire les mots de passe temporaires dans un log ou csv ou stdout pour pouvoir les communiquer
// [ ] ajouter l'action 'doit reset son mot de passe' à la création de l'utilisateur
// TODO: Nice to have
// [ ] besoin d'une confirmation car une fois les mots de passe générés ou affichés, si on relance la machine on écrase les valeurs et on les perd ?
// [ ] comment on structure ça dans du code serveur admin ?
// [ ] changer de devDependencies en dependencies pour le client kc

dotenv.config();

const FIELDS = {
  nom: 'Nom',
  prénom: 'Prénom',
  email: 'E-mail',
  profils: 'Profils',
  nomChantier: 'Nom du chantier',
  idChantier: 'ID du chantier',
};
const EXPECTED_CSV_FIELDS = Object.values(FIELDS);

const REALM = 'DITP';
const KEYCLOAK_URL = 'https://dev-keycloak-ditp.osc-fr1.scalingo.io';

type CsvRecord = Record<string, string>;

function checkRecords(records: CsvRecord[]) {
  assert(records, 'CSV parsing errors: no record?');
  let lineNb = 0;
  for (const record of records) {
    lineNb += 1;
    for (const field of EXPECTED_CSV_FIELDS) {
      assert(record[field], `Erreur de parsing CSV ligne: ${lineNb}. Mauvais header ?`);
    }
  }
}

async function processRecord(kcAdminClient: any, record: CsvRecord) {
  const email = record[FIELDS.email];
  // ex. de mot de passe généré : JHqVoxOoHnGLbhR
  const password = faker.internet.password(15, false, /\w/, '');
  try {
    await kcAdminClient.users.create({
      realm: REALM,
      username: email,
      email,
      firstName: record[FIELDS.prénom],
      lastName: record[FIELDS.nom],
      enabled: true,
      requiredActions: [],
      credentials: [{ temporary: true, type: 'password', value: password }],
    });
    logger.info(`Utilisateur ${email} créé.`);
    logger.debug({ password });
  } catch (error: any) {
    if (error.message == 'Request failed with status code 409') {
      logger.warn(`L'email ${email} existe déjà.`);
    } else {
      throw error;
    }
  }
}

// Oups?! Voir : https://github.com/TypeStrong/ts-node/discussions/1290
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)');

async function connectKc() {
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

  const someUsers = await kcAdminClient.users.find({ first: 0, max: 10 });
  logger.info({ someUsers });

  return kcAdminClient;
}

async function main() {
  const filename = process.argv[2];
  if (!filename) {
    logger.error('Missing filename.');
    return;
  }
  const kcAdminClient = await connectKc();

  const parseOptions = { columns: true, skipEmptyLines: true };
  const contents = fs.readFileSync(filename, 'utf8');
  const records: CsvRecord[] = parse(contents, parseOptions);
  checkRecords(records);
  for (const record of records) {
    await processRecord(kcAdminClient, record);
  }
}

main().catch((error) => {
  logger.error(error);
});
