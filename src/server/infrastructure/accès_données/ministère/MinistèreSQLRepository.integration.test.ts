import { ministere, perimetre, PrismaClient } from '@prisma/client';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import MinistèreSQLRepository from '@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository';

describe('MinistèreSQLRepository', () => {
  test('Accède à un ministère', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: MinistèreRepository = new MinistèreSQLRepository(prisma);
    const ministere1: ministere = { id: '1', nom: 'Min 1', icone: 'remix::icon-1' };
    const ministere2: ministere = { id: '2', nom: 'Min 2', icone: 'remix::icon-2' };
    await prisma.ministere.createMany({ data: [ministere1, ministere2] });
    const périmètre1: perimetre = { id: 'PER-001', nom: 'Périmètre 1', ministere: 'Justice', ministere_id: '1' };
    const périmètre2: perimetre = { id: 'PER-002', nom: 'Périmètre 2', ministere: 'Justice', ministere_id: '1' };
    const périmètre3: perimetre = { id: 'PER-003', nom: 'Périmètre 3', ministere: 'Agriculture', ministere_id: '2' };
    await prisma.perimetre.createMany({ data: [périmètre1, périmètre2, périmètre3] });

    // WHEN
    const ministères = await repository.getListe();

    // THEN
    expect(ministères).toStrictEqual([
      {
        nom: 'Agriculture',
        périmètresMinistériels: [{ id: 'PER-003', nom: 'Périmètre 3', ministere_id: '2' }],
        icône: 'remix::icon-2',
      },
      {
        nom: 'Justice',
        périmètresMinistériels: [{ id: 'PER-001', nom: 'Périmètre 1', ministere_id: '1' }, { id: 'PER-002', nom: 'Périmètre 2', ministere_id: '1' }],
        icône: 'remix::icon-1',
      },
    ]);
  });
});
