/* eslint-disable sonarjs/no-duplicate-string */
import { indicateur } from '@prisma/client';
import IndicateurRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/IndicateurRowBuilder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { Maille } from '@/server/domain/maille/Maille.interface';
import IndicateurSQLRepository from './IndicateurSQLRepository';

describe('IndicateurSQLRepository', () => {

  describe("Listes d'indicateurs", () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
    // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupérerParChantierId('CH-001');

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
          .withSource('ma source')
          .withDescription('ma description')
          .withModeDeCalcul('mon mode de calcul')
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
          .withSource('ma source')
          .withDescription('ma description')
          .withModeDeCalcul('mon mode de calcul')
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withNom('Indicateur 2')
          .withChantierId(chantierId)
          .withEvolutionValeurActuelle([0.4, 0, 0.654])
          .withEvolutionDateValeurActuelle([date1, date2, date3])
          .withDateValeurInitiale(dateC)
          .withDateValeurActuelle(dateD)
          .withSource('ma source')
          .withDescription('ma description')
          .withModeDeCalcul('mon mode de calcul')
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupérerParChantierId(chantierId);

      // THEN
      expect(result.length).toEqual(2);
      expect(result[0].id).toEqual('IND-001');
      expect(result[0].source).toStrictEqual('ma source');
      expect(result[0].modeDeCalcul).toStrictEqual('mon mode de calcul');
      expect(result[1].id).toEqual('IND-002');
      expect(result[1].description).toEqual('ma description');
    });
  });

  describe('récupérerDétails', () => {
    test('Retourne un objet vide si aucun indicateur présent en base', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupérerDétails('IND-001',  'départementale');

      // THEN
      expect(result).toStrictEqual({});
    });

    test('Récupère les détails de deux indicateurs présent en base pour un id indicateur et une maille', async () => {
      // GIVEN
      const indicateurId = 'IND-001';
      const maille: Maille = 'départementale';
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurRowBuilder()
          .withId(indicateurId)
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('02')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(40)
          .build(),

        new IndicateurRowBuilder()
          .withId(indicateurId)
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('03')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(40)
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupérerDétails(indicateurId, maille);

      // THEN
      expect(result).toStrictEqual(
        {
          [indicateurId]: {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              avancement: {
                global: 40,
                annuel: null,
              },
            },
            '03': {
              codeInsee: '03',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              avancement: {
                global: 40,
                annuel: null,
              },
            },
          },
        },
      );
    });
  });

  describe('récupererDétailsParChantierIdEtTerritoire', () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001',  'départementale', ['01']);

      // THEN
      expect(result).toStrictEqual({});
    });

    test('Récupère les détails de deux indicateurs départemental du même chantier', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurRowBuilder()
          .withId('IND-001')
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('01')
          .withEvolutionValeurActuelle( [1, 2, 3])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1000)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1789)
          .withObjectifTauxAvancement(20)
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('02')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(40)
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('03')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(40)
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-001', 'départementale', ['01', '02', '03']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-001': {
            '01' : {
              codeInsee: '01',
              valeurInitiale: 1000,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 2, 3],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1789,
              avancement: {
                global: 20,
                annuel: null,
              },
            },
          },
          'IND-002': {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              avancement: {
                global: 40,
                annuel: null,
              },
            },
            '03': {
              codeInsee: '03',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              avancement: {
                global: 40,
                annuel: null,
              },
            },
          },
        },
      );
    });

    test('Ne récupère pas les indicateurs d\'autres mailles et d\'autres chantiers', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      const indicateurs: indicateur[] = [
        new IndicateurRowBuilder()
          .withId('IND-001')
          .withChantierId('CH-001')
          .withMaille('DEPT')
          .withCodeInsee('01')
          .withEvolutionValeurActuelle( [1, 2, 3])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1000)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1789)
          .withObjectifTauxAvancement(20)
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withChantierId('CH-002')
          .withMaille('DEPT')
          .withCodeInsee('02')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(40)
          .build(),

        new IndicateurRowBuilder()
          .withId('IND-002')
          .withChantierId('CH-002')
          .withMaille('REG')
          .withCodeInsee('02')
          .withEvolutionValeurActuelle( [1, 4, 6])
          .withEvolutionDateValeurActuelle(['2021-01-01', '2021-02-01', '2021-03-01'])
          .withValeurInitiale(1001)
          .withDateValeurInitiale('2021-01-01')
          .withObjectifValeurCible(1790)
          .withObjectifTauxAvancement(30)
          .build(),
      ];

      await prisma.indicateur.createMany({ data: indicateurs });

      // WHEN
      const result = await repository.récupererDétailsParChantierIdEtTerritoire('CH-002', 'régionale', ['01', '02']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-002': {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01T00:00:00.000Z',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01T00:00:00.000Z', '2021-02-01T00:00:00.000Z', '2021-03-01T00:00:00.000Z'],
              valeurCible: 1790,
              avancement: {
                global: 30,
                annuel: null,
              },
            },
          },
        },
      );
    });
  });
});
