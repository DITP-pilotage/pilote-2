import { ministere, perimetre } from '@prisma/client';
import MinistèreRepository from '@/server/domain/ministère/MinistèreRepository.interface';
import MinistèreSQLRepository from '@/server/infrastructure/accès_données/ministère/MinistèreSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('MinistèreSQLRepository', () => {
  test('Accède à un ministère', async () => {
    // GIVEN
    const repository: MinistèreRepository = new MinistèreSQLRepository(prisma);
    const ministere1: ministere = { id: '1', nom: 'Agriculture', icone: 'remix::icon-1', a_supprimer: false, acronyme: 'MASA' };
    const ministere2: ministere = { id: '2', nom: 'Justice', icone: 'remix::icon-2', a_supprimer: false, acronyme: 'MINJ' };
    await prisma.ministere.createMany({ data: [ministere1, ministere2] });
    const périmètre1: perimetre = { id: 'PER-001', nom: 'Périmètre 1', ministere: 'déprécié', ministere_id: '2', a_supprimer: false };
    const périmètre2: perimetre = { id: 'PER-002', nom: 'Périmètre 2', ministere: 'déprécié', ministere_id: '2', a_supprimer: false };
    const périmètre3: perimetre = { id: 'PER-003', nom: 'Périmètre 3', ministere: 'déprécié', ministere_id: '1', a_supprimer: false };
    await prisma.perimetre.createMany({ data: [périmètre1, périmètre2, périmètre3] });

    // WHEN
    const ministères = await repository.getListe();

    // THEN
    expect(ministères).toStrictEqual([
      {
        id: '1',
        acronyme: 'MASA',
        nom: 'Agriculture',
        périmètresMinistériels: [{ id: 'PER-003', nom: 'Périmètre 3', ministèreId: '1', ministèreNom: 'Agriculture' }],
        icône: 'remix::icon-1',
      },
      {
        id: '2',
        acronyme: 'MINJ',
        nom: 'Justice',
        périmètresMinistériels: [{ id: 'PER-001', nom: 'Périmètre 1', ministèreId: '2', ministèreNom: 'Justice' }, { id: 'PER-002', nom: 'Périmètre 2', ministèreId: '2', ministèreNom: 'Justice' }],
        icône: 'remix::icon-2',
      },
    ]);
  });
});
