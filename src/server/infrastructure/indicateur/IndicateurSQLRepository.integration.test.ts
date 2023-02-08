import { indicateur } from '@prisma/client';
import IndicateurRowBuilder from '@/server/infrastructure/test/tools/rowBuilder/IndicateurRowBuilder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import IndicateurSQLRepository from './IndicateurSQLRepository';

describe('IndicateurSQLRepository', () => {
  test("Récupère une liste vide quand il n'y a pas d'indicateurs", async () => {
    // GIVEN
    const repository = new IndicateurSQLRepository(prisma);

    // WHEN
    const result = await repository.getByChantierId('CH-001');

    // THEN
    expect(result).toStrictEqual([]);
  });

  test('Récupérer une liste d\'indicateur via un ID de chantier', async () => {
    // GIVEN
    const repository = new IndicateurSQLRepository(prisma);

    const chantierId = 'CH-001';
    
    const indicateurs: indicateur[] = [
      new IndicateurRowBuilder()
        .withId('IND-001')
        .withNom('Indicateur 1')
        .withChantierId(chantierId)
        .build(),

      new IndicateurRowBuilder()
        .withId('IND-001')
        .withNom('Indicateur 1')
        .withChantierId(chantierId)
        .withCodeInsee('78')
        .withMaille('REG')
        .build(),

      new IndicateurRowBuilder()
        .withId('IND-002')
        .withNom('Indicateur 2')
        .withChantierId(chantierId)
        .build(),
    ];

    await prisma.indicateur.createMany({ data: indicateurs });

    // WHEN
    const result = await repository.getByChantierId(chantierId);

    // THEN
    expect(result.length).toEqual(2);
    expect(result[0].id).toEqual('IND-001');
    expect(result[1].id).toEqual('IND-002');
  });

  test('Récupérer une liste d\'indicateur contenant un tableau de valeurs actuelles', async () => {
    // GIVEN
    const repository = new IndicateurSQLRepository(prisma);

    const chantierId = 'CH-001';

    const indicateurs: indicateur[] = [
      new IndicateurRowBuilder()
        .withId('IND-001')
        .withNom('Ind 1')
        .withChantierId(chantierId)
        .withEvolutionValeurActuelle([1, 2])
        .build(),

      new IndicateurRowBuilder()
        .withId('IND-001')
        .withNom('Ind 1')
        .withChantierId(chantierId)
        .withCodeInsee('78')
        .withMaille('REG')
        .withEvolutionValeurActuelle([0.4, 43, 18])
        .build(),

      new IndicateurRowBuilder()
        .withId('IND-002')
        .withNom('Indicateur 2')
        .withChantierId(chantierId)
        .withEvolutionValeurActuelle([222, 333, 444, 555])
        .build(),

      new IndicateurRowBuilder()
        .withId('IND-003')
        .withNom('Indicateur 3')
        .withChantierId(chantierId)
        .withEvolutionValeurActuelle([0.4, 0, 0.654, 22])
        .build(),
    ];

    await prisma.indicateur.createMany({ data: indicateurs });

    // WHEN
    const result = await repository.getByChantierId(chantierId);

    // THEN
    expect(result.length).toEqual(3);
    expect(result[0].evolutionValeurActuelle).toEqual([1, 2]);
    expect(result[1].evolutionValeurActuelle).toEqual([222, 333, 444, 555]);
    expect(result[2].evolutionValeurActuelle).toEqual([0.4, 0, 0.654, 22]);
  });
});
