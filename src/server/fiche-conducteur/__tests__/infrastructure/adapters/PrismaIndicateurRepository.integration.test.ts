import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaIndicateurRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaIndicateurRepository';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository(prisma);
  });
  describe('#récupérerIndicImpactParChantierId', () => {
    it('doit récupérer les indicateurs d\'impact avec une pondération national supérieur à 0 du chantier associé', async () => {
      // Given
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier OK',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-001',
          nom: 'Indicateur OK',
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          type_id: 'IMPACT',
          territoire_code: 'NAT-FR',
          ponderation_zone_reel: 20,
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-002',
          nom: 'Indicateur OK autre ID',
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          type_id: 'IMPACT',
          ponderation_zone_reel: 20,
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-003',
          nom: 'Indicateur KO maille',
          chantier_id: 'CH-168',
          code_insee: '01',
          maille: 'DEPT',
          type_id: 'IMPACT',
          territoire_code: 'DEPT-01',
          ponderation_zone_reel: 20,
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-004',
          nom: 'Indicateur OK autre type_id',
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          type_id: 'Q_SERV',
          ponderation_zone_reel: 20,
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-005',
          nom: 'Indicateur K0 pondération',
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          type_id: 'IMPACT',
          ponderation_zone_reel: 0,
        },
      });
      await prisma.indicateur.create({
        data: {
          id: 'IND-006',
          nom: 'Indicateur KO pondération autre type',
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          type_id: 'Q_SERV',
          ponderation_zone_reel: 0,
        },
      });
      // When
      const listeIndicateursResult = await prismaIndicateurRepository.récupérerIndicImpactParChantierId('CH-168');
      // Then
      expect(listeIndicateursResult.map(indicateur => indicateur.nom)).toIncludeSameMembers(['Indicateur OK', 'Indicateur OK autre ID', 'Indicateur OK autre type_id']);
      expect(listeIndicateursResult.map(indicateur => indicateur.type)).toIncludeSameMembers(['IMPACT', 'IMPACT', 'Q_SERV']);
    });
  });
});
