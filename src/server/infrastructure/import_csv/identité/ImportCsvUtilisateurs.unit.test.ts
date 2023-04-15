/* eslint-disable sonarjs/no-duplicate-string */
import { DIR_PROJET } from '@/server/domain/identité/Profil';
import { CsvRecord, parseCsvRecords } from '@/server/infrastructure/import_csv/identité/ImportCsvUtilisateurs';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';

describe('ImportCsvUtilisateurs', () => {
  it('parse des données à importer', () => {
    const csvRecord: CsvRecord = {
      Nom: 'Dylan',
      Prénom: 'Bob',
      Email: 'bob@dylan.com',
      Profil: DIR_PROJET,
      ChantierIds: 'CH-1234',
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
      ['e-mail']: 'bob@dylan.com',
      ['profils']: DIR_PROJET,
      ['id du chantier']: 'CH-001|CH-002',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-001', 'CH-002']),
    ]);
  });

  it('ignore les colonnes inconnues', () => {
    const csvRecord: CsvRecord = {
      Nom: 'Dylan',
      Prénom: 'Bob',
      Email: 'bob@dylan.com',
      Profils: DIR_PROJET,
      colonneInconnue: 'valeur',
    };
    const result = parseCsvRecords([csvRecord]);
    expect(result).toStrictEqual([
      new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, []),
    ]);
  });

  describe('Le champs profil', () => {
    it('accepte les codes de profils', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profil: DIR_PROJET,
        ChantierIds: 'CH-1234',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
      ]);
    });

    it('accepte "profils" comme nom de colonne', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profils: DIR_PROJET,
        ChantierIds: 'CH-1234',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
      ]);
    });

    it('accepte une description comme profil', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profils: 'Directeur de projet',
        ChantierIds: 'CH-1234',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-1234']),
      ]);
    });
  });

  describe('Le champs ChantierId', () => {
    it('accepte une liste d\'id chantiers', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profils: DIR_PROJET,
        ChantierIds: 'CH-001|CH-002  | CH-003',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-001', 'CH-002', 'CH-003']),
      ]);
    });

    it('donne une liste de chantiers vide si colonne absente', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profil: DIR_PROJET,
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, []),
      ]);
    });

    it('donne une liste vide si la cellule ChantierIds est vide', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profils: DIR_PROJET,
        ChantierIds: '',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, []),
      ]);
    });

    it('cumule les valeurs trouvées dans les colonnes possibles pour ChantierIds', () => {
      const csvRecord: CsvRecord = {
        Nom: 'Dylan',
        Prénom: 'Bob',
        Email: 'bob@dylan.com',
        Profils: DIR_PROJET,
        ChantierIds: 'CH-001',
        ['Id du chantier']: 'CH-002',
      };
      const result = parseCsvRecords([csvRecord]);
      expect(result).toStrictEqual([
        new UtilisateurPourImport('Dylan', 'Bob', 'bob@dylan.com', DIR_PROJET, ['CH-001', 'CH-002']),
      ]);
    });
  });
});
