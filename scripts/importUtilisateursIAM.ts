import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import process from 'node:process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/logger';
dotenv.config();

// TODO
// [x] installer le client keycloak
// [x] créer le client keycloak sur dev-keycloak
// [x] faire un get sur l'api keycloak
// [x] faire fonctionner en ts ? abandonner le ts ?
// [x] type: module = c'est quoi les conséquences ? on garde ? on jette ?
// [ ] faire un post pour créer un utilisateurs
// [x] pouvoir lire les données dans un csv (quelle lib ?)
// [x] quel format csv ?
// [ ] faire le ou les posts pour créer les utilisateurs
// [ ] comment on structure ça dans du code serveur admin ?
// [ ] changer de devDependencies en dependencies pour le client kc
const EXPECTED_FIELDS = ['Nom', 'Prénom', 'E-mail', 'Profils', 'Nom du chantier', 'ID du chantier'];

function checkRecords(records: Record<string, string>[]) {
  assert(records, 'CSV parsing errors: no record?');
  let lineNb = 0;
  for (const record of records) {
    lineNb += 1;
    for (const field of EXPECTED_FIELDS) {
      assert(record[field], `Erreur de parsing CSV ligne: ${lineNb}. Mauvais header ?`);
    }
  }
}

async function processRecord(kcAdminClient: any, record: Record<string, string>) {
  logger.info(record);
}

// Oups?! Voir : https://github.com/TypeStrong/ts-node/discussions/1290
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('specifier', 'return import(specifier)');

async function connectKc() {
  const { default: KcAdminClient } = await dynamicImport('@keycloak/keycloak-admin-client');
  const kcAdminClient = new KcAdminClient({
    baseUrl: 'https://dev-keycloak-ditp.osc-fr1.scalingo.io',
    realmName: 'DITP',
    requestArgOptions: {},
  });

  const clientId =  process.env.IMPORT_CLIENT_ID;
  const clientSecret = process.env.IMPORT_CLIENT_SECRET;
  if (!clientId || ! clientSecret) {
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
  const records = parse(contents, parseOptions);
  checkRecords(records);
  for (const record of records) {
    await processRecord(kcAdminClient, record);
  }
}

main();
