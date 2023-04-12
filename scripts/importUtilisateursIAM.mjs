import process from 'node:process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'csv-parse/sync';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import dotenv from 'dotenv'
dotenv.config()

const EXPECTED_FIELDS = ['Nom', 'Prénom', 'E-mail', 'Profils', 'Nom du chantier', 'ID du chantier'];

function checkRecords(records) {
  assert(records, 'CSV parsing errors: no record?');
  let lineNb = 0;
  for (const record of records) {
    lineNb += 1;
    for (const field of EXPECTED_FIELDS) {
      assert(record[field], `Erreur de parsing CSV ligne: ${lineNb}. Mauvais header ?`);
    }
  }
}

async function processRecord(kcAdminClient, record) {
  console.log(record);
}

async function connectKc() {
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
  console.log({ someUsers });

  return kcAdminClient;
}

async function main() {
  const filename = process.argv[2];
  if (!filename) {
    console.log('Missing filename.');
    return;
  }
  const kcAdminClient = await connectKc();

  const parseOptions = { columns: true, skipEmptyLines: true };
  const contents = fs.readFileSync(filename, 'utf8');
  const records = parse(contents, parseOptions);
  checkRecords(records);
  for (const record of records) {
    await processRecord(kcAdminClient, record);
  };
}

main();
