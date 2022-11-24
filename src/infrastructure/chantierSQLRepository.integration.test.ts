import { PrismaClient } from '@prisma/client';
import { ChantierRepository, ChantierSQLRepository } from './chantierSQLRepository';

test('fails', async () => {
  // GIVEN
  const prisma = new PrismaClient();
  const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
  // WHEN
  const chantier = await chantierRepository.getById('THD');
  // THEN
  expect(chantier.porteur).toBe('MEFSIN');
});
