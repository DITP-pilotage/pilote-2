import { PrismaClient } from '@prisma/client';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';
import ChantierInfoSQLRepository from './ChantierInfoSQLRepository';

describe('ChantierInfoSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierInfoRepository = new ChantierInfoSQLRepository(prisma);
    const chantierInitial: ChantierInfo = {
      id: 'THD',
      nom: 'Chantier 1',
      id_périmètre: 'PER-001',
      météo: null,
      avancement: { annuel: null, global: null },
    };
    const chantierInitial2: ChantierInfo = {
      id: 'TUP',
      nom: 'Chantier 2',
      id_périmètre: 'PER-001',
      météo: null,
      avancement: { annuel: null, global: null },
    };
    await repository.add(chantierInitial);
    await repository.add(chantierInitial2);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
