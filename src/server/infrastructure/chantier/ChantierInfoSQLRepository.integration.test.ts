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
    const chantier1 = ChantierFixture.générer({
      id: 'CH-001',
      mailles: { nationale: { FR: { codeInsee: 'FR', avancement: { annuel: 50, global: 50 } } }, régionale: {}, départementale: {} },
    });
    const chantier2 = ChantierFixture.générer({
      id: 'CH-002',
      mailles: {
        nationale: { FR: { codeInsee: 'FR', avancement: { annuel: 50, global: 50 } } },
        régionale: {},
        départementale: { '13': { codeInsee: '13', avancement: { annuel: 50, global: 50 } } },
      },
    });
    await chantierRepository.add(chantier1);
    await chantierRepository.add(chantier2);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    const ids = chantiers.map(c => c.id);
    expect(ids).toEqual(['CH-001', 'CH-002']);
  });
});
