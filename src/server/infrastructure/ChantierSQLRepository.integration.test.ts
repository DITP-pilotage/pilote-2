import { PrismaClient } from '@prisma/client';
import ChantierInfo from '@/server/domain/chantier/ChantierInfo.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
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
    await chantierRepository.add(chantierInitial);
    await chantierRepository.add(chantierInitial2);

    // WHEN
    const chantiers = await chantierRepository.getListe();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
