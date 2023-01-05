import { PrismaClient } from '@prisma/client';
import ChantierFixture from '@/fixtures/ChantierFixture';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id', async () => {
    // GIVEN
    const prisma = new PrismaClient();
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
    const prisma = new PrismaClient();
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
    const prisma = new PrismaClient();
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
});
