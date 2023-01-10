import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierRowBuilder from '@/server/infrastructure/test/rowBuilder/ChantierRowBuilder';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').withNom('Chantier 1').build(),
        new ChantierRowBuilder()
          .withId('CH-002').withNom('Chantier 2').build(),
      ],
    });

    // WHEN
    const result1 = await repository.getById('CH-001');
    const result2 = await repository.getById('CH-002');

    // THEN
    expect(result1.nom).toEqual('Chantier 1');
    expect(result2.nom).toEqual('Chantier 2');
  });

  test('un chantier contenant une maille nationale', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierRowBuilder()
        .withId(chantierId).withMailleNationale().withTauxAvancement(18).build(),
    });

    // WHEN
    const result = await repository.getById(chantierId);

    // THEN
    expect(result.mailles).toStrictEqual({
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: {
            annuel: null,
            global: 18,
          },
        },
      },
      régionale: {},
      départementale: {},
    });
  });

  test('un chantier contenant une maille nationale et départementale', async () => {
    // GIVEN
    const chantierId = 'CH-001';
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId(chantierId).withMailleNationale().withTauxAvancement(18).build(),
        new ChantierRowBuilder()
          .withId(chantierId).withMaille('DEPT').withCodeInsee('13').withTauxAvancement(45).build(),
      ],
    });
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    // WHEN
    const result = await repository.getById(chantierId);

    // THEN
    expect(result.mailles).toStrictEqual({
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: {
            annuel: null,
            global: 18,
          },
        },
      },
      départementale: {
        '13': {
          codeInsee: '13',
          avancement: { annuel: null, global: 45 },
        },
      },
      régionale: {},
    });
  });

  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierRowBuilder()
          .withId('CH-001').build(),
        new ChantierRowBuilder()
          .withId('CH-002').withMailleNationale().withTauxAvancement(50).build(),
        new ChantierRowBuilder()
          .withId('CH-002').withMaille('DEPT').withCodeInsee('13').withTauxAvancement(50).build(),
      ],
    });

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    const ids = chantiers.map(chantier => chantier.id);
    expect(ids).toStrictEqual(['CH-001', 'CH-002']);
    expect(chantiers[1].mailles.départementale['13'].avancement.global).toBe(50);
  });

  describe("Gestion d'erreur", () => {
    test('Erreur en cas de maille inconnue', async () => {
      // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.createMany({
        data: [
          new ChantierRowBuilder()
            .withId(chantierId).withMailleNationale().build(),
          new ChantierRowBuilder()
            .withId(chantierId).withMaille('INCONNUE').build(),
        ],
      });

      // WHEN
      const request = async () => {
        await repository.getById(chantierId);
      };

      // THEN
      await expect(request).rejects.toThrow(/INCONNUE/);
    });
  });
});
