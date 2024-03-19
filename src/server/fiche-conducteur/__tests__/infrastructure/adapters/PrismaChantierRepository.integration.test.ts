import { PrismaChantierRepository } from '@/server/fiche-conducteur/infrastructure/adapters/PrismaChantierRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('PrismaChantierRepository', () => {
  let prismaChantierRepository: PrismaChantierRepository;

  beforeEach(() => {
    prismaChantierRepository = new PrismaChantierRepository(prisma);
  });

  describe('#récupérerParIdEtParTerritoireCode', () => {
    it('doit récupérer le chantier associé', async () => {
      // Given
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier OK',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          est_territorialise: true,
          directeurs_administration_centrale: ['DAC 1', 'DAC 2'],
          directeurs_projet: ['DP 1', 'DP 2'],
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier KO maille',
          code_insee: '01',
          maille: 'REG',
          territoire_code: 'REG-01',
          est_territorialise: false,
          directeurs_administration_centrale: ['DAC 3', 'DAC 4'],
          directeurs_projet: ['DP 3', 'DP 4'],
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-169',
          nom: 'Nom chantier KO ID',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          est_territorialise: false,
          directeurs_administration_centrale: ['DAC 5', 'DAC 6'],
          directeurs_projet: ['DP 5', 'DP 6'],
        },
      });

      // When
      const chantierResult = await prismaChantierRepository.récupérerParIdEtParTerritoireCode({ chantierId: 'CH-168', territoireCode: 'NAT-FR' });
      
      // Then
      expect(chantierResult.id).toEqual('CH-168');
      expect(chantierResult.nom).toEqual('Nom chantier OK');
      expect(chantierResult.estTerritorialise).toEqual(true);
      expect(chantierResult.listeDirecteursAdministrationCentrale).toIncludeSameMembers(['DAC 1', 'DAC 2']);
      expect(chantierResult.listeDirecteursProjet).toIncludeSameMembers(['DP 1', 'DP 2']);
    });
  });

  describe('#récupérerMailleNatEtDeptParId', () => {
    it('doit récupérer le chantier associé', async () => {
      // Given
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier OK',
          code_insee: 'FR',
          taux_avancement: 10.2,
          taux_avancement_annuel: 9.2,
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          meteo: 'SOLEIL',
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier OK maille DEPT',
          code_insee: '01',
          taux_avancement: 15.3,
          taux_avancement_annuel: 13.3,
          maille: 'DEPT',
          territoire_code: 'DEPT-01',
          meteo: 'COUVERT',
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier OK maille DEPT taux null',
          code_insee: '02',
          taux_avancement: null,
          taux_avancement_annuel: null,
          maille: 'DEPT',
          territoire_code: 'DEPT-02',
          meteo: 'SOLEIL',
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier KO maille REG',
          code_insee: '01',
          taux_avancement: 10,
          maille: 'REG',
          territoire_code: 'REG-01',
          meteo: 'SOLEIL',
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-169',
          nom: 'Nom chantier KO ID',
          code_insee: 'FR',
          taux_avancement: 10,
          maille: 'NAT',
          territoire_code: 'NAT-FR',
          meteo: 'SOLEIL',
        },
      });

      // When
      const chantierResult = await prismaChantierRepository.récupérerMailleNatEtDeptParId('CH-168');

      // Then
      expect(chantierResult).toHaveLength(3);
      expect(chantierResult.map(chantier => chantier.tauxAvancement)).toIncludeSameMembers([10.2, 15.3, null]);
      expect(chantierResult.map(chantier => chantier.tauxAvancementAnnuel)).toIncludeSameMembers([9.2, 13.3, null]);
      expect(chantierResult.map(chantier => chantier.codeInsee)).toIncludeSameMembers(['FR', '01', '02']);
      expect(chantierResult.map(chantier => chantier.meteo)).toIncludeSameMembers(['SOLEIL', 'SOLEIL', 'COUVERT']);
    });
  });
});
