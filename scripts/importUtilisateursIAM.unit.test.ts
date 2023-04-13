/* eslint-disable sonarjs/no-duplicate-string */
import { DIR_PROJET } from '@/server/domain/identité/Profil';
import { créerImportRecord, CsvRecord } from './importUtilisateursIAM';

describe('Script import utilisateurs', () => {
  it('crée des données à importer', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
      ['Nom du chantier']: 'Un chantier',
      ['ID du chantier']: 'CH-1234',
      ['Mot de passe']: 'abc1234',
    };
    const result = créerImportRecord(csvRecord);
    expect(result).toEqual({
      nom: 'Dylan',
      prénom: 'Bob',
      profilCode: DIR_PROJET,
      email: 'bob@dylan.com',
      chantierIds: ['CH-1234'],
      motDePasse: 'abc1234',
    });
  });

  it('un id de chantier vide dans le csv génère une liste vide à importer', () => {
    const csvRecord: CsvRecord = {
      ['Nom']: 'Dylan',
      ['Prénom']: 'Bob',
      ['E-mail']: 'bob@dylan.com',
      ['Profils']: 'Directeur de projet',
      ['Nom du chantier']: 'Un chantier',
      ['ID du chantier']: '',
      ['Mot de passe']: 'abc1234',
    };
    const result = créerImportRecord(csvRecord);
    expect(result).toEqual({
      nom: 'Dylan',
      prénom: 'Bob',
      profilCode: DIR_PROJET,
      email: 'bob@dylan.com',
      chantierIds: [],
      motDePasse: 'abc1234',
    });
  });
});
