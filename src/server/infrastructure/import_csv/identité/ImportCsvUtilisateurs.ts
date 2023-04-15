import { parse } from 'csv-parse/sync';
import { faker } from '@faker-js/faker/locale/fr';
import { stringify } from 'csv-stringify/sync';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DIR_PROJET, DITP_ADMIN, DITP_PILOTAGE } from '@/server/domain/identité/Profil';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import ImporteUtilisateursUseCase from '@/server/usecase/identité/ImporteUtilisateursUseCase';

const CSV_PARSE_OPTIONS = {
  columns: true,
  skipEmptyLines: true,
};

const CSV_WRITE_OPTIONS = {
  header:true,
};

const FIELDS: Record<string, string> = {
  nom: 'Nom',
  prénom: 'Prénom',
  email: 'E-mail',
  profils: 'Profils',
  nomChantier: 'Nom du chantier',
  idChantier: 'ID du chantier',
  motDePasse: 'Mot de passe',
};
const EXPECTED_RECORD_FIELDS = Object.values(FIELDS);

const CODES_PROFILS: Record<string, string> = {
  ['DITP - Admin']: DITP_ADMIN,
  ['DITP - Pilotage']: DITP_PILOTAGE,
  ['Directeur de projet']: DIR_PROJET,
};

export type CsvRecord = Record<string, string>;

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

function toImportRecord(csvRecord: CsvRecord): UtilisateurPourImport {
  const profilCode = CODES_PROFILS[csvRecord[FIELDS.profils]];

  const chantierIds = [];
  const csvChantierId = csvRecord[FIELDS.idChantier];
  if (csvChantierId != '') {
    chantierIds.push(csvChantierId);
  }

  return new UtilisateurPourImport(
    csvRecord[FIELDS.nom],
    csvRecord[FIELDS.prénom],
    csvRecord[FIELDS.email],
    csvRecord[FIELDS.motDePasse],
    profilCode,
    chantierIds,
  );
}

export function parseCsvRecords(csvRecords: CsvRecord[]): UtilisateurPourImport[] {
  assert(csvRecords, 'Erreur de parsing CSV. Pas de lignes ?');

  const result: UtilisateurPourImport[] = [];
  let lineNb = 0;
  for (const csvRecord of csvRecords) {
    lineNb += 1;
    for (const field of EXPECTED_RECORD_FIELDS) {
      assert.notEqual(csvRecord[field], null, `Erreur de parsing CSV ligne: ${lineNb}. Mauvais header ?`);
    }
    const nomDeProfil = csvRecord[FIELDS.profils];
    assert(CODES_PROFILS[nomDeProfil], `Nom de profil ${nomDeProfil} inconnu. Profils connus : ${Object.keys(CODES_PROFILS)}`);
    const importRecord = toImportRecord(csvRecord);
    result.push(importRecord);
  }
  return result;
}

export default class ImportCsvUtilisateurs {
  async importeFichierUtilisateurs(filename: string) {
    assert(filename);
    const utilisateursPourImport = this.parseCsvUtilisateurs(filename);
    const usecase = new ImporteUtilisateursUseCase(utilisateursPourImport);
    await usecase.run();
  }

  private parseCsvUtilisateurs(filename: string): UtilisateurPourImport[] {
    const contents = fs.readFileSync(filename, 'utf8');
    const csvRecords: CsvRecord[] = parse(contents, CSV_PARSE_OPTIONS);

    if (!contientMotsDePasse(csvRecords)) {
      générerEtÉcrireMotsDePasse(csvRecords, filename);
    }

    return parseCsvRecords(csvRecords);
  }
}
