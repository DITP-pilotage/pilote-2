import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

describe('ChantierRandomRepository', () => {
  test('génère une valeur', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierRandomRepository();

    // WHEN
    const chantier = await repository.getById('abc1234', 'FR', 'NAT');

    // THEN
    expect(chantier.id).toBe('abc1234');
    expect(chantier.indicateurs).toHaveLength(5);
  });
});
