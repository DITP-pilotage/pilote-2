import { agrégerDonnéesTerritoires, agrégerDonnéesTerritoiresÀUnAgrégat, initialiserDonnéesTerritoiresAgrégésVide } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';

describe('Données territoires', () => {
  const listeDonnéesTerritoires = [{
    nationale: {   
      FR: {
        avancement: {
          global : 67,
          annuel: 99,
        },
        codeInsee: 'FR',
        météo: null,
      },
    },
    régionale: {},
    départementale: {
      '01': {
        avancement: {
          global: 40,
          annuel: 27,
        },
        codeInsee: '01',
        météo: null,
      },
    },
  },
  {
    nationale: {
      FR: {
        avancement: {
          global : 67,
          annuel: 99,
        },
        codeInsee: 'FR',
        météo: null,
      },
    },
    régionale: {},
    départementale: {
      '01': {
        avancement: {
          global : 32,
          annuel: 24,
        },
        codeInsee : '01',
        météo: null,
      },
    },
  }];
  
  describe('Initialiser données territoires agrégés vide', () => {
    it('Initialise un objet contenant chaque territoire avec son code Insee et un avancement vide', () => {
      //GIVEN
      //WHEN
      const résultat = initialiserDonnéesTerritoiresAgrégésVide();
      //THEN
      expect(résultat.départementale['75']).toStrictEqual({ avancement: [] });
      expect(résultat.régionale['02']).toStrictEqual({ avancement: [] });
      expect(résultat.nationale.FR).toStrictEqual({ avancement: [] });
    });
  });
  
  describe('Agréger données territoires à un agrégat', () => {
    it('Ajoute les données agrégés à un territoire donné', () => {
      //GIVEN
      const donnéesTerritoiresAgrégées = initialiserDonnéesTerritoiresAgrégésVide();
      const donnéesTerritoire01 = listeDonnéesTerritoires[0];
      //WHEN
      const résultat = agrégerDonnéesTerritoiresÀUnAgrégat(donnéesTerritoiresAgrégées, donnéesTerritoire01);
      //THEN
      expect(résultat.départementale['01']).toStrictEqual({ avancement: [{ annuel: 27, global: 40 }] });
    });
  });
  
  describe('Agréger données territoires', () => {
    it("Documente l'attendu pour un seul chantier en entrée", () => {
      //GIVEN
      const listeDonnéesTerritoiresAvecUnChantier = [listeDonnéesTerritoires[0]];
      //WHEN
      const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoiresAvecUnChantier);
      //THEN
      const attenduDépartementAvecDonnées = { avancement: [{ annuel: 27, global: 40 }] };
      const attenduDépartementSansDonnées = { avancement: [{ annuel: null, global: null }] };
      expect(résultat.départementale['01']).toStrictEqual(attenduDépartementAvecDonnées);
      expect(résultat.départementale['02']).toStrictEqual(attenduDépartementSansDonnées);
    });
    
    it("Documente l'attendu pour deux chantiers en entrée", function () {
      //WHEN
      const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoires);
      //THEN
      const attendu = { avancement: [{ annuel: 27, global: 40 }, { annuel: 24, global: 32 }] };
      expect(résultat.départementale['01']).toStrictEqual(attendu);
    });
  });
});
  
