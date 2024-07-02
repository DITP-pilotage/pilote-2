import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaIndicateurRepository } from '@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository';

describe('PrismaIndicateurRepository', () => {
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository(prisma);
  })
  ;
  it("doit récupérer les données associés à l'indicateur", async () => {
    // Given
    const indicId = 'IND-001';
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
        id: 'IND-001',
        nom: 'Indicateur OK',
        chantier_id: 'CH-168',
        code_insee: '01',
        maille: 'REG',
        type_id: 'IMPACT',
        territoire_code: 'REG-01',
        ponderation_zone_reel: 20,
      },
    });
    // When
    const listeDonneesIndicateurs = await prismaIndicateurRepository.listerParIndicId({ indicId });
    // Then
    expect(listeDonneesIndicateurs).toHaveLength(2);
  });
});
