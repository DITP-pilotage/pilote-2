import { PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial1: Chantier = {
      id: 'THD',
      nom: 'Chantier 1',
      nomPPG: null,
      axe: null,
      id_périmètre: 'PER-001',
      perimètres_ids: ['PER-001'],
      zone_nom: 'National',
      code_insee: 'FR',
      météo: null,
      avancement: { annuel: null, global: null },
      indicateurs: [],
    };
    const chantierInitial2: Chantier = {
      id: 'TUP',
      nom: 'Chantier 2',
      axe: null,
      nomPPG: null,
      id_périmètre: 'PER-001',
      météo: null,
      avancement: { annuel: null, global: null },
      indicateurs: [],
    };
    await repository.add(chantierInitial1);
    await repository.add(chantierInitial2);

    // WHEN
    const result1 = await repository.getById('THD');
    const result2 = await repository.getById('TUP');

    // THEN
    expect(result1).toEqual(chantierInitial1);
    expect(result2).toEqual(chantierInitial2);
  });
});
