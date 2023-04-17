import { parse } from 'csv-parse/sync';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CABINET_MINISTERIEL,
  DIR_PROJET,
  DITP_ADMIN,
  DITP_PILOTAGE,
  vérifieCodeProfil,
} from '@/server/domain/identité/Profil';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import ImporterUtilisateursUseCase from '@/server/usecase/identité/ImporterUtilisateursUseCase';

const CSV_PARSE_OPTIONS = {
  columns: true,
  skipEmptyLines: true,
};

const CHAMPS: Record<string, string> = {
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
  ['Cabinets ministériels et direction d\'administration centrale']: CABINET_MINISTERIEL,
};

export type CsvRecord = Record<string, string>;

function _normalizeFieldname(fieldname: string) {
  return fieldname
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/-/g, '')
    .trim();
}

function _normalizeCsvRecord(record: CsvRecord): CsvRecord {
  const result: CsvRecord = {};
  for (const [k, v] of Object.entries(record)) {
    result[_normalizeFieldname(k)] = v;
  }
  return result;
}

function _splitCsvCell(cell: string): string[] {
  return cell.split(/ *\| */);
}

export function parseCsvRecord(csvRecord: CsvRecord): UtilisateurPourImport {
  const normalizedRecord = _normalizeCsvRecord(csvRecord);
  const codeProfilCsv = normalizedRecord[CHAMPS.profil] || normalizedRecord[CHAMPS.profils];
  const profilCode = vérifieCodeProfil(codeProfilCsv)
    ? codeProfilCsv
    : CODES_PROFILS[codeProfilCsv];

  const chantierIds = [];
  const chantierIdsCsv = normalizedRecord[CHAMPS.chantierIds];
  if (chantierIdsCsv && chantierIdsCsv != '') {
    for (const id of _splitCsvCell(chantierIdsCsv)) {
      chantierIds.push(id);
    }
  }
  const idDuChantier = normalizedRecord[CHAMPS.idDuChantier];
  if (idDuChantier && idDuChantier != '') {
    for (const id of _splitCsvCell(idDuChantier)) {
      chantierIds.push(id);
    }
  }

  return new UtilisateurPourImport(
    normalizedRecord[CHAMPS.email],
    normalizedRecord[CHAMPS.nom],
    normalizedRecord[CHAMPS.prénom],
    profilCode,
    chantierIds,
  );
}

export default class ImportateurCsvUtilisateurs {
  async importeFichierUtilisateurs(filename: string) {
    assert(filename);
    const utilisateursPourImport = this.parseCsvUtilisateurs(filename);
    const usecase = new ImporterUtilisateursUseCase(utilisateursPourImport);
    await usecase.run();
  }

  private parseCsvUtilisateurs(filename: string): UtilisateurPourImport[] {
    const contents = fs.readFileSync(filename, 'utf8');
    const csvRecords: CsvRecord[] = parse(contents, CSV_PARSE_OPTIONS);

    return this.parseCsvRecords(csvRecords);
  }

  private parseCsvRecords(csvRecords: CsvRecord[]): UtilisateurPourImport[] {
    assert(csvRecords, 'Erreur de parsing CSV. Pas de lignes ?');

    const result: UtilisateurPourImport[] = [];
    for (const csvRecord of csvRecords) {
      const importRecord = parseCsvRecord(csvRecord);
      result.push(importRecord);
    }
    return result;
  }
}
