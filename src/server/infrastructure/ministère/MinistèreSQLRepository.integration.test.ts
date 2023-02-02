import { perimetre, PrismaClient } from '@prisma/client';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import MinistèreSQLRepository from '@/server/infrastructure/ministère/MinistèreSQLRepository';

describe('MinistèreSQLRepository', () => {
  test('Accède à un ministère', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: MinistèreRepository = new MinistèreSQLRepository(prisma);
    const périmètre1: perimetre = { id: 'PER-001', nom: 'Périmètre 1', ministere: 'Justice' };
    const périmètre2: perimetre = { id: 'PER-002', nom: 'Périmètre 2', ministere: 'Justice' };
    const périmètre3: perimetre = { id: 'PER-003', nom: 'Périmètre 3', ministere: 'Agriculture' };
    await prisma.perimetre.createMany({ data: [périmètre1, périmètre2, périmètre3] });

    // WHEN
    const ministères = await repository.getListe();

    // THEN
    expect(ministères).toStrictEqual([
      {
        nom: 'Agriculture',
        périmètresMinistériels: [{ id: 'PER-003', nom: 'Périmètre 3' }],
      },
      {
        nom: 'Justice',
        périmètresMinistériels: [{ id: 'PER-001', nom: 'Périmètre 1' }, { id: 'PER-002', nom: 'Périmètre 2' }],
      },
    ]);
  });
});
