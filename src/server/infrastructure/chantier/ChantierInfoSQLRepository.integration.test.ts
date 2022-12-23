import { PrismaClient } from '@prisma/client';
import ChantierInfoRepository from '@/server/domain/chantier/ChantierInfoRepository.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierInfoSQLRepository from './ChantierInfoSQLRepository';
import ChantierSQLRepository from './ChantierSQLRepository';
import { generateChantier } from './ChantierRandomRepository';

describe('ChantierInfoSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierInfoRepository = new ChantierInfoSQLRepository(prisma);
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantier1 = generateChantier('CH-001');
    const chantier2 = generateChantier('CH-002');
    await chantierRepository.add(chantier1);
    await chantierRepository.add(chantier2);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    const ids = chantiers.map((c) => c.id);
    expect(ids).toEqual(['CH-001', 'CH-002']);
  });
});

import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierSQLRepository from '@/server/infrastructure/chantier/ChantierSQLRepository';
describe('A JETER', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: ChantierInfoRepository = new ChantierInfoSQLRepository(prisma);
    const chantierSQLRepository: ChantierSQLRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = {
      id: 'THD',
      nom: 'Chantier 1',
      axe: null,
      nomPPG: null,
      id_périmètre: 'PER-001',
      perimètreIds: ['PER-001'],
      zoneNom: 'National',
      codeInsee: 'FR',
      tauxAvancement: 88.5,
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
      perimètreIds: ['PER-001'],
      zoneNom: 'National',
      codeInsee: 'FR',
      tauxAvancement: null,
      météo: null,
      avancement: { annuel: null, global: null },
      indicateurs: [],
    };
    await chantierSQLRepository.add(chantierInitial);
    await chantierSQLRepository.add(chantierInitial2);

    // WHEN
    const chantiersInfos = await repository.getListe();

    // THEN
    expect(chantiersInfos).toEqual([chantierInitial, chantierInitial2]);
  });
});