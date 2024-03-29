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

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '04',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            meteo: 'SOLEIL',
            a_taux_avancement_regional: true,
            a_meteo_regional: true,
            a_taux_avancement_departemental: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: null,
            taux_avancement_annuel: null,
            ministeres: ['1009'],
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Un nom de chantier 2',
            code_insee: '04',
            maille: 'DEPT',
            meteo: null,
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: 2,
            taux_avancement_annuel: 2,
            ministeres: ['1010'],
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-004',
            est_barometre: true,
            nom: 'Un nom de chantier 4',
            code_insee: '87',
            maille: 'DEPT',
            meteo: 'NUAGEUX',
            territoire_code: 'DEPT-87',
            a_taux_avancement_departemental: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: null,
            taux_avancement_annuel: null,
            ministeres: ['1011'],
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '01',
            maille: 'REG',
            meteo: 'ORAGE',
            territoire_code: 'REG-01',
            a_taux_avancement_departemental: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: 1,
            taux_avancement_annuel: 1,
            ministeres: ['1012'],
          },
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
            nom: 'Un nom de chantier 1',
            codeMinisterePorteur: '1009',
          }, {
            id: 'CH-002',
            tauxAvancement: 2,
            tauxAvancementAnnuel: 2,
            meteo: null,
            nom: 'Un nom de chantier 2',
            codeMinisterePorteur: '1010',
          },
        ]);
      });

      it('quand les chantier est territorialisé, doit récupérer ces chantiers', async () => {
        // Given
        const territoireCode = 'DEPT-34';

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '04',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: false,
            est_territorialise: true,
            taux_avancement: null,
          },
        });
        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Un nom de chantier 2',
            code_insee: '04',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: false,
            est_territorialise: false,
            taux_avancement: 2,
          },
        });
        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: true,
            est_territorialise: false,
            taux_avancement: 1,
          },
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

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '04',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: false,
            est_territorialise: true,
            taux_avancement: null,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: false,
            nom: 'Un nom de chantier 2',
            code_insee: '04',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: false,
            est_territorialise: true,
            taux_avancement: 2,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_departemental: false,
            a_meteo_departemental: true,
            est_territorialise: false,
            taux_avancement: 1,
          },
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

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '04',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: null,
            taux_avancement_annuel: null,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Un nom de chantier 2',
            code_insee: '04',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: 2,
            taux_avancement_annuel: 2,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-004',
            est_barometre: true,
            nom: 'Un nom de chantier 4',
            code_insee: '87',
            maille: 'REG',
            territoire_code: 'REG-02',
            a_taux_avancement_regional: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: null,
            taux_avancement_annuel: null,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '01',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_departemental: true,
            a_meteo_departemental: true,
            est_territorialise: true,
            taux_avancement: 1,
            taux_avancement_annuel: 1,
          },
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

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '04',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: false,
            a_meteo_regional: false,
            est_territorialise: true,
            taux_avancement: null,
          },
        });
        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: true,
            nom: 'Un nom de chantier 2',
            code_insee: '04',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: false,
            a_meteo_regional: false,
            est_territorialise: false,
            taux_avancement: 2,
          },
        });
        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '01',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_regional: true,
            a_meteo_regional: true,
            est_territorialise: true,
            a_meteo_departemental: true,
            a_taux_avancement_departemental: true,
            taux_avancement: 1,
          },
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

        await prisma.chantier.create({
          data: {
            id: 'CH-001',
            est_barometre: true,
            nom: 'Un nom de chantier 1',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: false,
            a_meteo_regional: false,
            est_territorialise: true,
            taux_avancement: null,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-002',
            est_barometre: false,
            nom: 'Un nom de chantier 2',
            code_insee: '01',
            maille: 'REG',
            territoire_code: 'REG-01',
            a_taux_avancement_regional: false,
            a_meteo_regional: false,
            est_territorialise: true,
            taux_avancement: 2,
          },
        });

        await prisma.chantier.create({
          data: {
            id: 'CH-003',
            est_barometre: true,
            nom: 'Un nom de chantier 3',
            code_insee: '34',
            maille: 'DEPT',
            territoire_code: 'DEPT-34',
            a_taux_avancement_regional: false,
            a_meteo_regional: true,
            est_territorialise: false,
            taux_avancement: 1,
          },
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
