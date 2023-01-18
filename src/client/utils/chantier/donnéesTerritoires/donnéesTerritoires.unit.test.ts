import { agrégerDonnéesTerritoires, agrégerDonnéesTerritoiresÀUnAgrégat, initialiserDonnéesTerritoiresAgrégésVide } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';

describe('Données territoires', () => {
  const listeDonnéesTerritoires = [
    {
      nationale: {   
        'FR': {
          avancement: { global : 67, annuel: 99 },
          codeInsee: 'FR',
          météo: 'ORAGE' as const,
        },
      },
      régionale: {},
      départementale: {
        '01': {
          avancement: { global: 40, annuel: 27 },
          codeInsee: '01',
          météo: 'NUAGE' as const,
        },
      },
    },
    {
      nationale: {
        'FR': {
          avancement: { global : 45.5, annuel: 21 },
          codeInsee: 'FR',
          météo: 'NON_RENSEIGNEE' as const,
        },
      },
      régionale: {},
      départementale: {
        '01': {
          avancement: { global : 32, annuel: 24 },
          codeInsee : '01',
          météo: 'NON_RENSEIGNEE' as const,
        },
      },
    },
  ];
  
  describe('Initialiser données territoires agrégés vide', () => {
    it('Initialise un objet contenant chaque territoire avec son code Insee et un avancement et une météo vides', () => {
      //WHEN
      const résultat = initialiserDonnéesTerritoiresAgrégésVide();
      //THEN
      expect(résultat.départementale['75']).toStrictEqual({ avancement: [], météo: [] });
      expect(résultat.régionale['02']).toStrictEqual({ avancement: [], météo: [] });
      expect(résultat.nationale.FR).toStrictEqual({ avancement: [], météo: [] });
    });
  });
  
  describe('Agréger données territoires à un agrégat', () => {
    it('Ajoute les données territoires d\'un chantier à la liste des données territoires agrégées', () => {
      //GIVEN
      const donnéesTerritoiresAgrégées = initialiserDonnéesTerritoiresAgrégésVide();
      const donnéesTerritoires = listeDonnéesTerritoires[0];      
      //WHEN
      const résultat = agrégerDonnéesTerritoiresÀUnAgrégat(donnéesTerritoiresAgrégées, donnéesTerritoires);
      //THEN
      expect(résultat.départementale['01']).toStrictEqual({ avancement: [{ annuel: 27, global: 40 }], météo: ['NUAGE'] });
      expect(résultat.nationale.FR).toStrictEqual({ avancement: [{ global : 67, annuel: 99 }], météo: ['ORAGE'] });
    });
  });
  
  describe('Agréger données territoires', () => {
    it("Documente l'attendu pour un seul chantier en entrée", () => {
      //GIVEN
      const listeDonnéesTerritoiresAvecUnChantier = [listeDonnéesTerritoires[0]];
      //WHEN
      const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoiresAvecUnChantier);
      //THEN
      const attenduDépartementAvecDonnées = { avancement: [{ annuel: 27, global: 40 }], météo: ['NUAGE'] };
      const attenduDépartementSansDonnées = { avancement: [{ annuel: null, global: null }], météo: ['NON_RENSEIGNEE'] };
      expect(résultat.départementale['01']).toStrictEqual(attenduDépartementAvecDonnées);
      expect(résultat.départementale['02']).toStrictEqual(attenduDépartementSansDonnées);
    });
    
    it("Documente l'attendu pour deux chantiers en entrée", () => {
      //WHEN
      const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoires);
      //THEN
      const attendu = { avancement: [{ annuel: 27, global: 40 }, { annuel: 24, global: 32 }], météo: ['NUAGE', 'NON_RENSEIGNEE'] };
      expect(résultat.départementale['01']).toStrictEqual(attendu);
    });
  });
});
  
