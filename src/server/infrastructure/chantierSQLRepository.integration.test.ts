import { PrismaClient } from '@prisma/client';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import { ChantierRepository } from './chantierRepository.interface';
import { ChantierSQLRepository } from './chantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = { id: 'THD', nom: 'Chantier 1', axe: 'X', ppg: 'X', porteur: 'MEFSIN' };
    const chantierInitial2: Chantier = { id: 'TUP', nom: 'Chantier 2', axe: 'Y', ppg: 'Y', porteur: 'BOUBOU' };
    await chantierRepository.add(chantierInitial);
    await chantierRepository.add(chantierInitial2);

    // WHEN
    const chantiers = await chantierRepository.getListeChantiers();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
