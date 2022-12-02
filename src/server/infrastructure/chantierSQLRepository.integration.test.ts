import { PrismaClient } from '@prisma/client';
import Chantier from 'server/domain/chantier/chantier.interface';
import { ChantierRepository } from '../domain/chantier/chantierRepository.interface';
import { ChantierSQLRepository } from './chantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = { id: 'THD', nom: 'Chantier 1', id_perimetre: 'PER-001' };
    const chantierInitial2: Chantier = { id: 'TUP', nom: 'Chantier 2', id_perimetre: 'PER-001' };
    await chantierRepository.add(chantierInitial);
    await chantierRepository.add(chantierInitial2);

    // WHEN
    const chantiers = await chantierRepository.getListeChantiers();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
