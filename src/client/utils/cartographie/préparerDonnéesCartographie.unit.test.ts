import {
  préparerDonnéesCartographieÀPartirDUneListe,
  préparerDonnéesCartographieÀPartirDUnÉlément,
} from '@/client/utils/cartographie/préparerDonnéesCartographie';
import { calculerMoyenne } from '@/client/utils/statistiques';
import {
  DonnéesTerritoires, initialiserDonnéesTerritoiresAgrégésVide,
  TerritoireSansCodeInsee,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { Agrégation } from '@/client/utils/types';

describe('Préparer données cartographie', () => {

  describe("Préparer données cartographie à partir d'une liste", () => {
    let donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>;

    beforeEach(() => {
      donnéesTerritoiresAgrégées = initialiserDonnéesTerritoiresAgrégésVide();
    });

    it("documente l'attendu avec l'exemple d'une fonction de réduction par calcul de moyenne", () => {
      // GIVEN
      donnéesTerritoiresAgrégées.régionale['84'] = {
        avancement: [
          { global : 5, annuel: null },
          { global : 10, annuel: null },
        ],
        météo: ['NON_RENSEIGNEE', 'NON_RENSEIGNEE'],
      };

      // WHEN
      const donnéesCartographie = préparerDonnéesCartographieÀPartirDUneListe(
        donnéesTerritoiresAgrégées,
        (territoiresAgrégés) => {
          const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
          return calculerMoyenne(valeurs);
        },
      );

      // THEN
      const donnéesCartographieAttendues = {
        régionale: {
          '84': 7.5,
        },
      };
      expect(donnéesCartographie.régionale['84']).toEqual(donnéesCartographieAttendues.régionale['84']);
    });
  });


  describe("Préparer données cartographie à partir d'un élément", () => {
    let donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>;

    beforeEach(() => {
      donnéesTerritoires = {
        nationale: {},
        régionale: {},
        départementale: {},
      };
    });

    it("documente l'attendu avec l'exemple de la météo d'un chantier", () => {
      // GIVEN
      donnéesTerritoires.départementale['01'] = {
        avancement: { global : null, annuel: null },
        météo: 'SOLEIL',
      };
      donnéesTerritoires.départementale['02'] = {
        avancement: { global : null, annuel: null },
        météo: 'COUVERT',
      };
      donnéesTerritoires.régionale['84'] = {
        avancement: { global : null, annuel: null },
        météo: 'ORAGE',
      };

      // WHEN
      const donnéesCartographie = préparerDonnéesCartographieÀPartirDUnÉlément(
        donnéesTerritoires,
        (territoire) =>  territoire.météo,
      );

      // THEN
      const donnéesCartographieAttendues = {
        départementale: {
          '01': 'SOLEIL',
          '02': 'COUVERT',
        },
        régionale: {
          '84': 'ORAGE',
        },
      };
      expect(donnéesCartographie.départementale['01']).toEqual(donnéesCartographieAttendues.départementale['01']);
      expect(donnéesCartographie.départementale['02']).toEqual(donnéesCartographieAttendues.départementale['02']);
      expect(donnéesCartographie.régionale['84']).toEqual(donnéesCartographieAttendues.régionale['84']);
    });
  });
});
