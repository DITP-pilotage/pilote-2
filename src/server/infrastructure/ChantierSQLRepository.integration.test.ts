import { PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
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
    await repository.add(chantierInitial);
    await repository.add(chantierInitial2);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
