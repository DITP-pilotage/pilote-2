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
      perimètreIds: ['PER-001'],
      zoneNom: 'National',
      codeInsee: 'FR',
      maille: 'NAT',
      météo: null,
      avancement: { annuel: null, global: { minimum: null, médiane: null, maximum: null, moyenne: 88.5 } },
      indicateurs: [],
      porteurNoDACIds: [],
      porteurDACIds: [],
    };
    const chantierInitial2: Chantier = {
      id: 'TUP',
      nom: 'Chantier 2',
      axe: null,
      nomPPG: null,
      id_périmètre: 'PER-001',
      perimètreIds: ['PER-001'],
      zoneNom: 'National',
      codeInsee: 'FR',
      maille: 'NAT',
      météo: null,
      avancement: { annuel: null, global: { minimum: null, médiane: null, maximum: null, moyenne: 88.5 } },
      indicateurs: [],
      porteurNoDACIds: [],
      porteurDACIds: [],
    };
    await repository.add(chantierInitial1);
    await repository.add(chantierInitial2);

    // WHEN
    const result1 = await repository.getById('THD', 'National');
    const result2 = await repository.getById('TUP', 'National');

    // THEN
    expect(result1).toEqual(chantierInitial1);
    expect(result2).toEqual(chantierInitial2);
  });
});
