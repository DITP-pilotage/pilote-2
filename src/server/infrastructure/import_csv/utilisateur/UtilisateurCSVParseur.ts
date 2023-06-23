import { Options, parse } from 'csv-parse/sync';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { ProfilCode, UtilisateurÀCréerOuMettreÀJour } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ScopeChantiers } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { CsvRecord } from './UtilisateurCSVParseur.interface';

export default class UtilisateurCSVParseur {
  private _CSV_PARSE_OPTIONS: Options = {
    columns: true,
    skipEmptyLines: true,
    trim: true,
  };

  private _colonnes = {
    nom: 'nom',
    prénom: 'prénom',
    email: 'email',
    profil: 'profil',
    scope: 'scope',
    territoires: 'territoires',
    périmètreIds: 'périmètreIds',
    chantierIds: 'chantierIds',
  };

  constructor(private _filename: string) {}

  parse(): UtilisateurÀCréerOuMettreÀJour[] {
    const contents = fs.readFileSync(this._filename, 'utf8');
    const csvRecords: CsvRecord[] = parse(contents, this._CSV_PARSE_OPTIONS);

    return this._parseCsvRecords(csvRecords);
  }

  _parseCsvRecords(csvRecords: CsvRecord[]): UtilisateurÀCréerOuMettreÀJour[] {
    assert(csvRecords, 'Erreur de parsing CSV. Pas de lignes ?');
  
    let utilisateurs: Record<string, UtilisateurÀCréerOuMettreÀJour> = {};

    for (const csvRecord of csvRecords) {
      const email = csvRecord[this._colonnes.email].toLowerCase();
      const scope = csvRecord[this._colonnes.scope].toLowerCase() as ScopeChantiers;

      if (utilisateurs[email] === undefined) {
        utilisateurs[email] = this._générerUtilisateurÀCréerOuMettreÀJour(csvRecord);
      }
  
      utilisateurs[email].habilitations[scope] = this._générerUneHabilitation(csvRecord[this._colonnes.chantierIds], csvRecord[this._colonnes.territoires], csvRecord[this._colonnes.périmètreIds]);
    }
  
    return Object.values(utilisateurs);
  }

  _splitCsvCell(cell?: string | null): string[] {
    return (cell === undefined || cell === null || cell === '') ? [] : cell?.split(/ *\| */);
  }
  
  _générerUneHabilitation(chantiers?: string | null, territoires?: string | null, périmètres?: string | null) {
    return {
      chantiers: this._splitCsvCell(chantiers),
      territoires: this._splitCsvCell(territoires),
      périmètres: this._splitCsvCell(périmètres),
    };
  }
  
  _générerUtilisateurÀCréerOuMettreÀJour(csvRecord: CsvRecord): UtilisateurÀCréerOuMettreÀJour {
    return {
      email: csvRecord[this._colonnes.email].toLowerCase(),
      nom: csvRecord[this._colonnes.nom].toLowerCase(),
      prénom: csvRecord[this._colonnes.prénom].toLowerCase(),
      profil: csvRecord[this._colonnes.profil].toUpperCase() as ProfilCode,
      fonction: null,
      habilitations: {
        lecture: this._générerUneHabilitation(),
        'saisie.commentaire': this._générerUneHabilitation(),
        'saisie.indicateur': this._générerUneHabilitation(),
      },
    };
  }
}
