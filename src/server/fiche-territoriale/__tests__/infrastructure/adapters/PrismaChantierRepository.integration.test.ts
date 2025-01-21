import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaChantierRepository } from '@/server/fiche-territoriale/infrastructure/adapters/PrismaChantierRepository';

describe('PrismaChantierRepository', () => {
  let prismaChantierRepository: PrismaChantierRepository;

  beforeEach(() => {
    prismaChantierRepository = new PrismaChantierRepository(prisma);
  });

  describe('listerParTerritoireCodePourUnDepartement', () => {
    describe('quand on est dans la maille département', () => {
      it('doit récupérer les chantiers de la maille', async () => {
        // Given
        const territoireCode = 'DEPT-34';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1009'],
          }, {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1010'],
          }, {
            id: 'CH-004',
            est_barometre: true,
            nom: 'Chantier 004',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1011'],
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1012'],
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: null,
            meteo: 'SOLEIL',
          }, {
            id: 'CH-002',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 2,
            meteo: null,
          }, {
            id: 'CH-004',
            zone_id: 'D87',
            code_insee: '87',
            maille: 'DEPT',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: null,
            meteo: 'NUAGEUX',
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 1,
            meteo: 'ORAGE',
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 2,
          }, {
            id: 'CH-004',
            jalon: 2025,
            code_insee: '87',
            maille: 'DEPT',
            territoire_code: 'DEPT-87',
            taux_avancement: null,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode });

        // Then
        expect(result).toHaveLength(2);
        expect(result).toMatchObject([
          {
            id: 'CH-001',
            tauxAvancement: null,
            tauxAvancementAnnuel: null,
            meteo: 'SOLEIL',
            nom: 'Chantier 001',
            codeMinisterePorteur: '1009',
          }, {
            id: 'CH-002',
            tauxAvancement: 2,
            tauxAvancementAnnuel: 2,
            meteo: null,
            nom: 'Chantier 002',
            codeMinisterePorteur: '1010',
          },
        ]);
      });

      it('quand les chantier est territorialisé, doit récupérer ces chantiers', async () => {
        // Given
        const territoireCode = 'DEPT-34';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: false,
            possede_meteo_regional: false,
            possede_taux_avancement_departemental: false,
            possede_meteo_departemental: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: false,
            possede_meteo_regional: false,
            possede_taux_avancement_departemental: false,
            possede_meteo_departemental: false,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-002',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 2,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 1,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 2,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode });
        // Then
        expect(result).toHaveLength(1);
        expect(result).toMatchObject([
          {
            tauxAvancement: null,
          },
        ]);
      });

      it("quand les chantier n'est pas dans le baromètre, doit pas récupérer ce chantier", async () => {
        // Given
        const territoireCode = 'DEPT-34';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: false,
            possede_meteo_regional: false,
            possede_taux_avancement_departemental: false,
            possede_meteo_departemental: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            est_barometre: false,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: false,
            possede_meteo_regional: false,
            possede_taux_avancement_departemental: false,
            possede_meteo_departemental: false,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-002',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 2,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 1,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 2,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode });
        // Then
        expect(result).toHaveLength(1);
        expect(result).toMatchObject([
          {
            tauxAvancement: null,
          },
        ]);
      });
    });
  });

  describe('listerParTerritoireCodePourUneRegion', () => {
    describe('quand on est dans la maille région', () => {
      it('doit récupérer les chantiers de la maille', async () => {
        // Given
        const territoireCode = 'REG-01';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1009'],
          }, {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1010'],
          }, {
            id: 'CH-004',
            est_barometre: true,
            nom: 'Chantier 004',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1011'],
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
            ministeres: ['1012'],
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-002',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 2,
          }, {
            id: 'CH-004',
            zone_id: 'R02',
            code_insee: '02',
            maille: 'REG',
            territoire_code: 'REG-02',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-003',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 1,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 2,
          }, {
            id: 'CH-004',
            jalon: 2025,
            code_insee: '02',
            maille: 'REG',
            territoire_code: 'REG-02',
            taux_avancement: null,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode });
        // Then
        expect(result).toHaveLength(2);
        expect(result).toMatchObject([
          {
            tauxAvancement: null,
            tauxAvancementAnnuel: null,
          }, {
            tauxAvancement: 2,
            tauxAvancementAnnuel: 2,
          },
        ]);
      });

      it('quand les chantier est territorialisé, doit récupérer ces chantiers', async () => {
        // Given
        const territoireCode = 'REG-01';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-002',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 2,
          }, {
            id: 'CH-003',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 1,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 2,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode });
        // Then
        expect(result).toHaveLength(1);
        expect(result).toMatchObject([
          {
            tauxAvancement: null,
          },
        ]);
      });

      it("quand les chantier n'est pas dans le baromètre, doit pas récupérer ce chantier", async () => {
        // Given
        const territoireCode = 'REG-01';

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            est_barometre: true,
            nom: 'Chantier 001',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            est_barometre: false,
            nom: 'Chantier 002',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Chantier 003',
            possede_taux_avancement_regional: true,
            possede_meteo_regional: true,
            possede_taux_avancement_departemental: true,
            possede_meteo_departemental: true,
            est_territorialise: true,
          }],
        });
        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: null,
          }, {
            id: 'CH-002',
            zone_id: 'R01',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 2,
          }, {
            id: 'CH-003',
            zone_id: 'D34',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement_mandat: 1,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: null,
          }, {
            id: 'CH-002',
            jalon: 2025,
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            taux_avancement: 2,
          }, {
            id: 'CH-003',
            jalon: 2025,
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            taux_avancement: 1,
          }],
        });

        // When
        const result = await prismaChantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode });
        // Then
        expect(result).toHaveLength(1);
        expect(result).toMatchObject([
          {
            tauxAvancement: null,
          },
        ]);
      });
    });
  });
});
