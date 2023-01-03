import { PrismaClient } from '@prisma/client';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';
import ChantierInfoSQLRepository from './ChantierInfoSQLRepository';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierInfoSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierInfoRepository = new ChantierInfoSQLRepository(prisma);
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantier1 = ChantierFixture.générer({ id: 'CH-001', zoneNom: 'National' });
    const chantier2 = ChantierFixture.générer({ id: 'CH-002', zoneNom: 'National' });
    const chantier3 = ChantierFixture.générer({ id: 'CH-003', zoneNom: 'Normandie' });
    await chantierRepository.add(chantier1);
    await chantierRepository.add(chantier2);
    await chantierRepository.add(chantier3);

    // WHEN
    const chantiers = await repository.getListeMailleNationale();

    // THEN
    const ids = chantiers.map((c) => c.id);
    expect(ids).toEqual(['CH-001', 'CH-002']);
  });
});
