import { PrismaClient } from '@prisma/client';
import Chantier from '@/server/domain/chantier/chantier.interface';
import { ChantierRepository } from '@/server/domain/chantier/chantierRepository.interface';
import { ChantierSQLRepository } from './chantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = {
      id: 'THD',
      nom: 'Chantier 1',
      id_périmètre: 'PER-001',
      météo: null,
      avancement: { annuel: null, global: null },
    };
    const chantierInitial2: Chantier = {
      id: 'TUP',
      nom: 'Chantier 2',
      id_périmètre: 'PER-001',
      météo: null,
      avancement: { annuel: null, global: null },
    };
    await chantierRepository.add(chantierInitial);
    await chantierRepository.add(chantierInitial2);

    // WHEN
    const chantiers = await chantierRepository.getListeChantiers();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
