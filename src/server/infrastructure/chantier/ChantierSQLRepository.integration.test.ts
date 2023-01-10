import ChantierFixture from '@/fixtures/ChantierFixture';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierRowBuilder from '@/server/infrastructure/test/rowBuilder/ChantierRowBuilder';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantiers = ChantierFixture.générerPlusieurs(2);

    await repository.add(chantiers[0]);
    await repository.add(chantiers[1]);

    // WHEN
    const result1 = await repository.getById(chantiers[0].id);
    const result2 = await repository.getById(chantiers[1].id);

    // THEN
    expect(result1.nom).toEqual(chantiers[0].nom);
    expect(result2.nom).toEqual(chantiers[1].nom);
  });

  test('un chantier contenant une maille nationale', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const valeursFixes = {
      mailles: {
        nationale: {
          FR: {
            codeInsee: 'FR',
            avancement: { annuel: 14, global: 18 },
          },
        },
        régionale: {},
        départementale: {},
      },
    };

    const chantier = ChantierFixture.générer(valeursFixes);
    await repository.add(chantier);

    // WHEN
    const result = await repository.getById(chantier.id);

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
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const valeursFixes = {
      mailles: {
        nationale: {
          FR: {
            codeInsee: 'FR',
            avancement: { annuel: 14, global: 18 },
          },
        },
        régionale: {},
        départementale: {
          '13': {
            codeInsee: '13',
            avancement: { annuel: 39, global: 45 },
          },
        },
      },
    };

    const chantier = ChantierFixture.générer(valeursFixes);
    await repository.add(chantier);

    // WHEN
    const result = await repository.getById(chantier.id);

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
    const chantier1 = ChantierFixture.générer();
    const chantier2 = ChantierFixture.générer({
      mailles: {
        nationale: { FR: { codeInsee: 'FR', avancement: { annuel: 50, global: 50 } } },
        régionale: {},
        départementale: { '13': { codeInsee: '13', avancement: { annuel: 50, global: 50 } } },
      },
    });
    await repository.add(chantier1);
    await repository.add(chantier2);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    const ids = chantiers.map(chantier => chantier.id);
    expect(ids).toStrictEqual([chantier1.id, chantier2.id]);
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
            .withId(chantierId)
            .withMailleNationale()
            .build(),
          new ChantierRowBuilder()
            .withId(chantierId)
            .withMaille('INCONNUE')
            .build(),
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
