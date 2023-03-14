import ChantierRandomRepository from '@/server/infrastructure/accès_données/chantier/ChantierRandomRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

describe('ChantierRandomRepository', () => {
  test('génère une valeur', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierRandomRepository();

    // WHEN
    const chantier = await repository.getById('abc1234');

    // THEN
    expect(chantier.id).toBe('abc1234');
  });

  test('un chantier random contient une maille', async () => {
    // GIVEN
    const valeursFixes = {
      mailles: {
        nationale: {
          FR: {
            codeInsee: 'FR',
            avancement: { annuel: 14, global: 18 },
            météo: 'SOLEIL' as Météo,
          },
        },
        régionale: {},
        départementale: {},
      },
    };
    const repository: ChantierRepository = new ChantierRandomRepository([valeursFixes]);

    // WHEN
    const chantier = await repository.getById('abc1234');

    // THEN
    expect(chantier.mailles).toStrictEqual({
      nationale: {
        FR: {
          codeInsee: 'FR',
          avancement: {
            annuel: 14,
            global: 18,
          },
          météo: 'SOLEIL',
        },
      },
      régionale: {},
      départementale: {},
    });
  });
});
