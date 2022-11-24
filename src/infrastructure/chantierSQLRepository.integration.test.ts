import { ChantierRepository, ChantierSQLRepository } from './chantierSQLRepository';

test('fails', async () => {
  // GIVEN
  const chantierRepository: ChantierRepository = new ChantierSQLRepository();
  // WHEN
  const chantier = await chantierRepository.getById('THD');
  // THEN
  expect(chantier.porteur).toBe('MEFSIN');
});
