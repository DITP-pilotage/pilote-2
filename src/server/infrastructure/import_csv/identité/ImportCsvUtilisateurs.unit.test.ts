/* eslint-disable sonarjs/no-duplicate-string */
import { DIR_PROJET } from '@/server/domain/identité/Profil';
import { CsvRecord, parseCsvRecords } from '@/server/infrastructure/import_csv/identité/ImportCsvUtilisateurs';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';

describe('ImportCsvUtilisateurs', () => {
  it('parse des données à importer', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
      ['Nom du chantier']: 'Un chantier',
      ['ID du chantier']: 'CH-1234',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
    ]);
  });

  it('accepte des champs non normalisés', () => {
    const csvRecord: CsvRecord = {
      ['nom']: 'Dylan',
      ['  PRENOM  ']: 'Bob',
      ['eMail']: 'bob@dylan.com',
      ['profils']: 'Directeur de projet',
      ['nom du chantier']: 'Un chantier',
      ['id du chantier']: 'CH-1234',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
    ]);
  });

  it('donne une liste de chantiers vide si pas renseignée', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, []),
    ]);
  });

  it('ignore les colonnes inconnues', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
      ['ID du chantier']: 'CH-1234',
      colonneInconnue: 'valeur',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
    ]);
  });

  it('un id de chantier vide dans le csv génère une liste vide à importer', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
      ['Nom du chantier']: 'Un chantier',
      ['ID du chantier']: '',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, []),
    ]);
  });
});
