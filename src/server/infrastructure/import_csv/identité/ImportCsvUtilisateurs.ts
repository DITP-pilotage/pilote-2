import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DIR_PROJET, DITP_ADMIN, DITP_PILOTAGE, vérifieCodeProfil } from '@/server/domain/identité/Profil';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import ImporteUtilisateursUseCase from '@/server/usecase/identité/ImporteUtilisateursUseCase';

const CSV_PARSE_OPTIONS = {
  columns: true,
  skipEmptyLines: true,
};

const FIELDS: Record<string, string> = {
  nom: 'nom',
  prénom: 'prenom',
  email: 'email',
  profil: 'profil',
  chantierIds: 'chantierids',
  // TODO: erreurs des fichiers fournis, à supprimer quand fichiers CSV mieux définis
  profils: 'profils',
  idDuChantier: 'id du chantier',
};

const CODES_PROFILS: Record<string, string> = {
  ['DITP - Admin']: DITP_ADMIN,
  ['DITP - Pilotage']: DITP_PILOTAGE,
  ['Directeur de projet']: DIR_PROJET,
};

export type CsvRecord = Record<string, string>;
export type NormalizedCsvRecord = Record<string, string>;

function splitCsvCell(cell: string): string[] {
  return cell.split(/ *\| */);
}

function toImportRecord(csvRecord: NormalizedCsvRecord): UtilisateurPourImport {
  const codeProfilCsv = csvRecord[FIELDS.profil] || csvRecord[FIELDS.profils];
  const profilCode = vérifieCodeProfil(codeProfilCsv)
    ? codeProfilCsv
    : CODES_PROFILS[codeProfilCsv];

  const chantierIds = [];
  const idDuChantier = csvRecord[FIELDS.idDuChantier];
  if (idDuChantier && idDuChantier != '') {
    chantierIds.push(idDuChantier);
  }
  const chantierIdsCsv = csvRecord[FIELDS.chantierIds];
  if (chantierIdsCsv && chantierIdsCsv != '') {
    for (const id of splitCsvCell(chantierIdsCsv)) {
      chantierIds.push(id);
    }
  }

  return new UtilisateurPourImport(
    csvRecord[FIELDS.nom],
    csvRecord[FIELDS.prénom],
    csvRecord[FIELDS.email],
    profilCode,
    chantierIds,
  );
}

function normalizeFieldname(fieldname: string) {
  return fieldname
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/-/g, '')
    .trim();
}

function normalizeCsvRecord(record: CsvRecord): NormalizedCsvRecord {
  const result: CsvRecord = {};
  for (const [k, v] of Object.entries(record)) {
    result[normalizeFieldname(k)] = v;
  }
  return result;
}

export function parseCsvRecords(csvRecords: CsvRecord[]): UtilisateurPourImport[] {
  assert(csvRecords, 'Erreur de parsing CSV. Pas de lignes ?');

  const normalizedCsvRecord = csvRecords.map(normalizeCsvRecord);
  const result: UtilisateurPourImport[] = [];
  for (const csvRecord of normalizedCsvRecord) {
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

    return parseCsvRecords(csvRecords);
  }
}
