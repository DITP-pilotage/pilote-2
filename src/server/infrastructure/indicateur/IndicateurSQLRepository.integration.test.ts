import { indicateur } from '@prisma/client';
import IndicateurRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/IndicateurRowBuilder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import IndicateurSQLRepository from './IndicateurSQLRepository';

describe('IndicateurSQLRepository', () => {

  describe("Listes d'indicateurs", () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
    // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.getByChantierId('CH-001');

      // THEN
      expect(result).toStrictEqual([]);
    });

    test('Récupérer une liste d\'indicateur via un ID de chantier contenant un tableau de valeurs actuelles', async () => {
    // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const chantierId = 'CH-001';
      const date1 = '2021-06-30';
      const date2 = '2022-06-30';
      const date3 = '2023-06-30';
      const dateA = '2018-07-24';
      const dateB = '2022-12-17';
      const dateC = '2019-09-02';
      const dateD = '2023-01-14';

      const indicateurs: indicateur[] = [
        new IndicateurRowBuilder()
          .withId('IND-001')
          .withNom('Indicateur 1')
          .withChantierId(chantierId)
          .withEvolutionValeurActuelle([1, 2])
          .withEvolutionDateValeurActuelle([date1, date2])
          .withDateValeurInitiale(dateA)
          .withDateValeurActuelle(dateB)
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-001')
          .withNom('Indicateur 1')
          .withChantierId(chantierId)
          .withCodeInsee('78')
          .withMaille('REG')
          .withEvolutionValeurActuelle([0.4, 43, 18])
          .withEvolutionDateValeurActuelle([date1, date2, date3])
          .withDateValeurInitiale('2017-01-01')
          .withDateValeurActuelle('2018-01-01')
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withNom('Indicateur 2')
          .withChantierId(chantierId)
          .withEvolutionValeurActuelle([0.4, 0, 0.654])
          .withEvolutionDateValeurActuelle([date1, date2, date3])
          .withDateValeurInitiale(dateC)
          .withDateValeurActuelle(dateD)
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.getByChantierId(chantierId);

      // THEN
      expect(result.length).toEqual(2);
      expect(result[0].id).toEqual('IND-001');
      expect(result[1].id).toEqual('IND-002');
      expect(result[0].mailles.nationale.FR.evolutionValeurActuelle).toEqual([1, 2]);
      expect(result[1].mailles.nationale.FR.evolutionValeurActuelle).toEqual([0.4, 0, 0.654]);
      expect(result[0].mailles.nationale.FR.evolutionDateValeurActuelle).toEqual([date1, date2]);
      expect(result[1].mailles.nationale.FR.evolutionDateValeurActuelle).toEqual([date1, date2, date3]);
      expect(result[0].mailles.nationale.FR.evolutionValeurActuelle.length).toEqual(result[0].mailles.nationale.FR.evolutionDateValeurActuelle.length);
      expect(result[1].mailles.nationale.FR.evolutionValeurActuelle.length).toEqual(result[1].mailles.nationale.FR.evolutionDateValeurActuelle.length);
      expect(result[0].mailles.nationale.FR.dateValeurInitiale).toEqual(dateA);
      expect(result[1].mailles.nationale.FR.dateValeurInitiale).toEqual(dateC);
      expect(result[0].mailles.nationale.FR.dateValeurActuelle).toEqual(dateB);
      expect(result[1].mailles.nationale.FR.dateValeurActuelle).toEqual(dateD);
    });
  });

  describe('Évolutions indicateur', () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.getEvolutionIndicateur('CH-001', 'IND-001', 'départementale', ['01']);

      // THEN
      expect(result).toStrictEqual(
        [
          {
            valeurCible: null,
            maille: 'départementale',
            code_insee: '01',
            évolutionValeurActuelle: [],
            évolutionDateValeurActuelle: [],
          },
        ],
      );
    });
  });
});
