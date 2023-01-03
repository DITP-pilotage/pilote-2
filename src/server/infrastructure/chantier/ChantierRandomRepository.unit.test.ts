import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';

describe('ChantierRandomRepository', () => {
  test('génère une valeur', async () => {
    // GIVEN
    const repository = new ChantierRandomRepository();

    // WHEN
    const chantier = await repository.getById('abc1234', 'FR', 'NAT');

    // THEN
    expect(chantier.id).toBe('abc1234');
    expect(chantier.indicateurs).toHaveLength(5);
  });
});
