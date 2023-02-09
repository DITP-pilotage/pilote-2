import {
  agrégerDonnéesTerritoires,
  agrégerDonnéesTerritoiresÀUnAgrégat, DonnéesTerritoires,
  initialiserDonnéesTerritoiresAgrégésVide, récupérerAvancement,
  récupérerMétéo, réduireDonnéesTerritoires, TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';

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

  describe("Récupérer l'avancement d'un territoire", () => {
    it("Si aucun avancement n'est disponible pour une région, on récupère des valeurs d'avancements nuls", () => {
      //WHEN
      const donnéesSansLaRégion01 = listeDonnéesTerritoires[0];
      const résultat = récupérerAvancement(donnéesSansLaRégion01, 'régionale', '01');
      //THEN
      expect(résultat).toStrictEqual({ 'annuel': null, 'global': null });
    });

    it("Documente l'attendu si un avancement est disponible pour un territoire", () => {
      //WHEN
      const donnéesTerritoires = listeDonnéesTerritoires[0];
      const résultat = récupérerAvancement(donnéesTerritoires, 'nationale', 'FR');
      //THEN
      expect(résultat).toStrictEqual({ 'annuel': 99, 'global': 67 });
    });
  });

  describe("Récupérer météo d'un territoire", () => {
    it("Si aucune météo n'est disponible pour un département, on récupère une météo NON_RENSEIGNEE", () => {
      //WHEN
      const donnéesSansLeDépartement51 = listeDonnéesTerritoires[0];
      const résultat = récupérerMétéo(donnéesSansLeDépartement51, 'départementale', '51');
      //THEN
      expect(résultat).toStrictEqual('NON_RENSEIGNEE');
    });

    it("Documente l'attendu si une météo est disponible pour un territoire", () => {
      //WHEN
      const donnéesTerritoire = listeDonnéesTerritoires[0];
      const résultat = récupérerMétéo(donnéesTerritoire, 'départementale', '01');
      //THEN
      expect(résultat).toStrictEqual('NUAGE');
    });
  });

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
    describe('liste de 1 chantier', () => {
      it("Documente l'attendu pour un cas nominal", () => {
        //GIVEN
        const listeDonnéesTerritoiresAvecUnChantier = [listeDonnéesTerritoires[0]];
        //WHEN
        const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoiresAvecUnChantier);
        //THEN
        const attenduFR = { avancement: [{ global: 67, annuel: 99 }], météo: ['ORAGE'] };
        const attendu01 = { avancement: [{ annuel: 27, global: 40 }], météo: ['NUAGE'] };
        expect(résultat.nationale.FR).toStrictEqual(attenduFR);
        expect(résultat.départementale['01']).toStrictEqual(attendu01);
      });

      it("Documente l'attendu pour des données manquantes pour un territoire", () => {
        //GIVEN
        const listeDonnéesTerritoiresAvecUnChantier = [listeDonnéesTerritoires[0]];
        //WHEN
        const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoiresAvecUnChantier);
        //THEN
        const attenduDépartementSansDonnées = { avancement: [{ annuel: null, global: null }], météo: ['NON_RENSEIGNEE'] };
        expect(résultat.départementale['02']).toStrictEqual(attenduDépartementSansDonnées);
      });
    });

    describe('liste de 2 chantiers', () => {
      it("Documente l'attendu pour un cas nominal", () => {
        //WHEN
        const résultat = agrégerDonnéesTerritoires(listeDonnéesTerritoires);
        //THEN
        const attendu = {
          avancement: [
            { annuel: 27, global: 40 },
            { annuel: 24, global: 32 },
          ],
          météo: [
            'NUAGE',
            'NON_RENSEIGNEE',
          ],
        };
        expect(résultat.départementale['01']).toStrictEqual(attendu);
      });
    });
  });

  describe('Réduire données territoires', () => {
    describe('liste de 2 chantier', () => {
      let listeDonnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>;

      beforeEach(() => {
        listeDonnéesTerritoiresAgrégées = initialiserDonnéesTerritoiresAgrégésVide();
      });

      it("Documente l'attendu avec l'exemple d'une fonction de réduction par comptage d'occurrence", () => {
        // GIVEN
        listeDonnéesTerritoiresAgrégées.régionale['84'] = {
          météo: ['NON_RENSEIGNEE', 'NON_RENSEIGNEE', 'SOLEIL', 'COUVERT'],
          avancement: [
            { global : null, annuel: null },
            { global : null, annuel: null },
            { global : null, annuel: null },
            { global : null, annuel: null },
          ],
        };

        // WHEN
        const résultat = réduireDonnéesTerritoires(
          listeDonnéesTerritoiresAgrégées,
          (territoiresAgrégés) => {
            const météos = territoiresAgrégés.météo;
            return {
              'NON_RENSEIGNEE': météos.filter(météo => météo === 'NON_RENSEIGNEE').length,
              'ORAGE': météos.filter(météo => météo === 'ORAGE').length,
              'COUVERT': météos.filter(météo => météo === 'COUVERT').length,
              'NUAGE': météos.filter(météo => météo === 'NUAGE').length,
              'SOLEIL': météos.filter(météo => météo === 'SOLEIL').length,
              'NON_NECESSAIRE': météos.filter(météo => météo === 'NON_NECESSAIRE').length,
            };
          },
          {
            'NON_RENSEIGNEE': 0,
            'ORAGE': 0,
            'COUVERT': 0,
            'NUAGE': 0,
            'SOLEIL': 0,
            'NON_NECESSAIRE': 0,
          },
        );

        // THEN
        const attendu = {
          régionale: {
            '84': {
              'NON_RENSEIGNEE': 2,
              'ORAGE': 0,
              'COUVERT': 1,
              'NUAGE': 0,
              'SOLEIL': 1,
              'NON_NECESSAIRE': 0,
            },
          },
        };
        expect(résultat.régionale['84']).toEqual(attendu.régionale['84']);
      });
    });
  });
});
