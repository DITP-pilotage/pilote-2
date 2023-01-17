import { agrégerDonnéesTerritoires } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';

describe('Données territoires', () => {
  it("Documente l'attendu pour un seul chantier en entrée", function () {
    //GIVEN
    const listeDonnéesTerritoires = [{
      'nationale' : {},
      'régionale': {},
      'départementale' : {
        '01' : {
          avancement: {
            global : 40,
            annuel: 27,
          },
          codeInsee : '01',
          météo: null,
        },
      },
    }];
    //WHEN
    const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoires);
    //THEN
    const attenduDépartementAvecDonnées = { 'avancement': [{ 'annuel': 27, 'global': 40 }] };
    const attenduDépartementSansDonnées = { 'avancement': [{ 'annuel': null, 'global': null }] };
    expect(résultat.départementale['01']).toStrictEqual(attenduDépartementAvecDonnées);
    expect(résultat.départementale['02']).toStrictEqual(attenduDépartementSansDonnées);
  });

  it("Documente l'attendu pour deux chantiers en entrée", function () {
    //GIVEN
    const listeDonnéesTerritoires = [{
      'nationale' : {},
      'régionale': {},
      'départementale' : {
        '01' : {
          avancement: {
            global : 40,
            annuel: 27,
          },
          codeInsee : '01',
          météo: null,
        },
      },
    },
    {
      'nationale' : {},
      'régionale': {},
      'départementale' : {
        '01' : {
          avancement: {
            global : 32,
            annuel: 24,
          },
          codeInsee : '01',
          météo: null,
        },
      },
    }];
    //WHEN
    const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoires);
    //THEN
    const attendu = { 'avancement': [
      { 'annuel': 27, 'global': 40 },
      { 'annuel': 24, 'global': 32 },
    ] };
    expect(résultat.départementale['01']).toStrictEqual(attendu);
  });

});
