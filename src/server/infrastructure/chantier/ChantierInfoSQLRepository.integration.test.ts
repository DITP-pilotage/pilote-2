import { PrismaClient } from '@prisma/client';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierInfoSQLRepository from './ChantierInfoSQLRepository';
import ChantierSQLRepository from './ChantierSQLRepository';
import { générerChantier } from './ChantierRandomRepository';

describe('ChantierInfoSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierInfoRepository = new ChantierInfoSQLRepository(prisma);
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantier1 = générerChantier('CH-001', 'FR', 'NAT');
    const chantier2 = générerChantier('CH-002', 'FR', 'NAT');
    const chantier3 = générerChantier('CH-003', '27', 'DEPT');
    await chantierRepository.add(chantier1);
    await chantierRepository.add(chantier2);
    await chantierRepository.add(chantier3);

    // WHEN
    const chantiers = await repository.getListeMailleNationale();

    // THEN
    const ids = chantiers.map((c) => c.id);
    expect(ids).toEqual(['CH-001', 'CH-002', 'CH-003']);
  });
});
