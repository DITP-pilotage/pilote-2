/* eslint-disable sonarjs/no-duplicate-string */
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
      expect(result).toStrictEqual([]);
    });

    test("Récupère l'évolution d'un indicateur départemental", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);
      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'indic',
          chantier_id: 'CH-001',
          objectif_valeur_cible: 1789,
          code_insee: '01',
          maille: 'DEPT',
          evolution_valeur_actuelle: [1, 2, 3],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
        },
      });

      // WHEN
      const result = await repository.getEvolutionIndicateur('CH-001', 'IND-001', 'départementale', ['01']);

      // THEN
      expect(result).toStrictEqual(
        [
          {
            valeurCible: 1789,
            maille: 'départementale',
            codeInsee: '01',
            évolutionValeurActuelle: [1, 2, 3],
            évolutionDateValeurActuelle: ['2021-01-01', '2021-02-01', '2021-03-01'],
          },
        ],
      );
    });
  });

  describe('Détails indicateur', () => {
    test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);

      // WHEN
      const result = await repository.getDetailsIndicateur('CH-001',  'départementale', ['01']);

      // THEN
      expect(result).toStrictEqual({});
    });

    test('Récupère les détails de deux indicateurs départemental du même chantier', async () => {
      // GIVEN
      const repository = new IndicateurSQLRepository(prisma);
      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'indic',
          chantier_id: 'CH-001',
          valeur_initiale: 1000,
          date_valeur_initiale: new Date('2021-01-01'),
          objectif_valeur_cible: 1789,
          code_insee: '01',
          maille: 'DEPT',
          evolution_valeur_actuelle: [1, 2, 3],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
          objectif_taux_avancement: 20,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'indic2',
          chantier_id: 'CH-001',
          valeur_initiale: 1001,
          date_valeur_initiale: new Date('2021-01-01'),
          objectif_valeur_cible: 1790,
          code_insee: '02',
          maille: 'DEPT',
          evolution_valeur_actuelle: [1, 4, 6],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
          objectif_taux_avancement: 40,
        },
      });

      // WHEN
      const result = await repository.getDetailsIndicateur('CH-001', 'départementale', ['01', '02']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-001': {
            '01' : {
              codeInsee: '01',
              valeurInitiale: 1000,
              dateValeurInitiale: '2021-01-01',
              valeurs: [1, 2, 3],
              dateValeurs: ['2021-01-01', '2021-02-01', '2021-03-01'],
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
              dateValeurInitiale: '2021-01-01',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01', '2021-02-01', '2021-03-01'],
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
      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'indic',
          chantier_id: 'CH-001',
          valeur_initiale: 1000,
          date_valeur_initiale: new Date('2021-01-01'),
          objectif_valeur_cible: 1789,
          code_insee: '01',
          maille: 'DEPT',
          evolution_valeur_actuelle: [1, 2, 3],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
          objectif_taux_avancement: 20,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'indic2',
          chantier_id: 'CH-002',
          valeur_initiale: 1001,
          date_valeur_initiale: new Date('2021-01-01'),
          objectif_valeur_cible: 1790,
          code_insee: '02',
          maille: 'DEPT',
          evolution_valeur_actuelle: [1, 4, 6],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
          objectif_taux_avancement: 40,
        },
      });

      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'indic2',
          chantier_id: 'CH-002',
          valeur_initiale: 1001,
          date_valeur_initiale: new Date('2021-01-01'),
          objectif_valeur_cible: 1790,
          code_insee: '02',
          maille: 'REG',
          evolution_valeur_actuelle: [1, 4, 6],
          evolution_date_valeur_actuelle: [new Date('2021-01-01'), new Date('2021-02-01'), new Date('2021-03-01')],
          objectif_taux_avancement: 40,
        },
      });

      // WHEN
      const result = await repository.getDetailsIndicateur('CH-002', 'régionale', ['01', '02']);

      // THEN
      expect(result).toStrictEqual(
        {
          'IND-002': {
            '02': {
              codeInsee: '02',
              valeurInitiale: 1001,
              dateValeurInitiale: '2021-01-01',
              valeurs: [1, 4, 6],
              dateValeurs: ['2021-01-01', '2021-02-01', '2021-03-01'],
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
});
