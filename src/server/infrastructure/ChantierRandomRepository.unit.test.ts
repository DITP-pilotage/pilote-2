import ChantierRandomRepository from '@/server/infrastructure/ChantierRandomRepository';

describe('ChantierRandomRepository', () => {
  test('génère une valeur', async () => {
    // GIVEN
    const repository = new ChantierRandomRepository();

    // WHEN
    const chantier = await repository.getById('abc1234');

    // THEN
    expect(chantier.id).toBe('abc1234');
  });
});
