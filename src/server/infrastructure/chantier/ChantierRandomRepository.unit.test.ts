import ChantierRandomRepository from '@/server/infrastructure/chantier/ChantierRandomRepository';

describe('ChantierRandomRepository', () => {
  test('génère une valeur', async () => {
    // GIVEN
    const repository = new ChantierRandomRepository();

    // WHEN
    const chantier = await repository.getById('abc1234', 'National');

    // THEN
    expect(chantier.id).toBe('abc1234');
    expect(chantier.indicateurs).toHaveLength(20);
  });
});
