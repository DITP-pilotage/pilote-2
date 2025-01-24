import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { prisma } from '@/server/db/prisma';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  let prismaChantierRepository: ChantierSQLRepository;

  beforeEach(() => {
    prismaChantierRepository = new ChantierSQLRepository(prisma);
  });

  describe('#récupérerChantiersSynthétisés', () => {
    it('doit récupérer la liste des territoires applicable de tout les chantiers applicables', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_territorialise: true,
          perimetre_ids: ['PER-01'],
          ate: 'ate',
          statut: 'PUBLIE',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_territorialise: true,
          perimetre_ids: ['PER-02'],
          ate: 'hors_ate_centralise',
          statut: 'BROUILLON',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          maille: 'REG',
          code_insee: '84',
          territoire_code: 'REG-84',
          zone_id: 'R84',
          taux_avancement_mandat: 20,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          zone_id: 'D01',
          taux_avancement_mandat: 30,
          est_applicable: true,
        }, {
          id: 'CH-001',
          maille: 'DEPT',
          code_insee: '02',
          territoire_code: 'DEPT-02',
          zone_id: 'D02',
          taux_avancement_mandat: 30,
          est_applicable: false,
        }, {
          id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          taux_avancement_mandat: 10,
          est_applicable: true,
        }, {
          id: 'CH-002',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          zone_id: 'FRANCE',
          taux_avancement_mandat: 5,
          est_applicable: true,
        }],
      });
      // When
      const result = await prismaChantierRepository.récupérerChantiersSynthétisés();

      // Then
      expect(result).toMatchObject([{
        id: 'CH-001',
        nom: 'Chantier 001',
        estTerritorialisé: true,
        périmètreIds: ['PER-01'],
        ate: 'ate',
        statut: 'PUBLIE',
        territoiresApplicables: ['REG-84', 'DEPT-01', 'NAT-FR'],
      }, {
        id: 'CH-002',
        nom: 'Chantier 002',
        estTerritorialisé: true,
        périmètreIds: ['PER-02'],
        ate: 'hors_ate_centralise',
        statut: 'BROUILLON',
        territoiresApplicables: ['NAT-FR'],
      }]);
    });
  });

  describe('#récupérerLesEntréesDUnChantier', () => {
    test("Quand on le chantier demandé n'existe pas, doit remonter une erreur en cas de chantier non trouvé", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        },
      });

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      const profil = ProfilEnum.DITP_ADMIN;

      // When
      const request = async () => {
        await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-002', habilitation, profil);
      };

      // Then
      await expect(request).rejects.toThrow(/chantier 'CH-002' non trouvé/);
    });

    test('quand on est un profil territorial, doit renvoyer la liste des chantiers sans la maille nationale', async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        }, {
          id: 'CH-001',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        }, {
          id: 'CH-001',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-88',
        }],
      });

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002'],
        territoires: ['DEPT-87'],
      } } as unknown as Utilisateur['habilitations'];

      const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

      // When
      const listeChantier = await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-001', habilitation, profil);

      // Then
      expect(listeChantier.nom).toEqual('Chantier 001');
      expect(listeChantier.chantier_territoire[0].territoire_code).toEqual('DEPT-87');
    });

    test("quand on n'est pas un profil territorial, doit renvoyer la liste des chantiers avec la maille nationale", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-002',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          code_insee: 'FR',
          maille: 'NAT',
          zone_id: 'FRANCE',
          territoire_code: 'NAT-FR',
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-87',
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          code_insee: '87',
          maille: 'DEPT',
          zone_id: 'D87',
          territoire_code: 'DEPT-88',
        },
      });

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002'],
        territoires: ['DEPT-87'],
      } } as unknown as Utilisateur['habilitations'];

      const profil = ProfilEnum.DITP_ADMIN;

      // When
      const listeChantier = await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-001', habilitation, profil);

      // Then
      expect(listeChantier.nom).toEqual('Chantier 001');
      expect(listeChantier.chantier_territoire).toHaveLength(2);
      expect(listeChantier.chantier_territoire).toIncludeAllPartialMembers([{
        territoire_code: 'DEPT-87',
      }, {
        territoire_code: 'NAT-FR',
      }]);
    });
  });

  describe('#récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions', () => {
    it("quand on a l'option estBarometre et estTerritorialise à true, doit remonter les chantiers ids contenant soit les chantiers du barometre soit territorialisé", async () => {
      // Given
      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        estTerritorialise: true,
        perimetreIds: [],
        listeChantierId: [],
        listeStatuts: [],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-001', 'CH-002', 'CH-003']);
    });

    it("quand on a l'option estBarometre est a false et estTerritorialise à false, doit remonter les chantiers ids contenant les chantiers du barometre", async () => {
      // Given

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: true,
        estTerritorialise: false,
        perimetreIds: [],
        listeChantierId: [],
        listeStatuts: [],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-001', 'CH-002']);
    });

    it("quand on a l'option estBarometre est a true et estTerritorialise à true, doit remonter les chantiers ids contenant les chantiers territorialise", async () => {
      // Given

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        estTerritorialise: true,
        perimetreIds: [],
        listeChantierId: [],
        listeStatuts: [],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-001', 'CH-003']);
    });

    it("quand on a l'option listeStatuts est définie, doit remonter les chantiers ids des chantiers avec les statuts demandés", async () => {
      // Given

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          statut: 'PUBLIE',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          statut: 'PUBLIE',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          statut: 'BROUILLON',
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          statut: 'ARCHIVE',
        }, {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          statut: 'SUPPRIME',
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        estTerritorialise: false,
        perimetreIds: [],
        listeChantierId: [],
        listeStatuts: ['PUBLIE', 'BROUILLON'],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-001', 'CH-002', 'CH-003']);
    });

    it("quand on a l'option perimetreIds est définie, doit remonter les chantiers ids des chantiers avec les périmètres demandés", async () => {
      // Given

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          statut: 'PUBLIE',
          perimetre_ids: ['PER-01', 'PER-02'],
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          statut: 'PUBLIE',
          perimetre_ids: ['PER-01'],
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          statut: 'BROUILLON',
          perimetre_ids: ['PER-02'],
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          statut: 'ARCHIVE',
          perimetre_ids: ['PER-03'],
        }, {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          statut: 'SUPPRIME',
          perimetre_ids: ['PER-01', 'PER-03'],
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        estTerritorialise: false,
        perimetreIds: ['PER-01', 'PER-02'],
        listeChantierId: [],
        listeStatuts: [],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-001', 'CH-002', 'CH-003', 'CH-005']);
    });

    it("quand on a l'option listeChantierId est définie, doit remonter les chantiers ids des chantiers avec les ids de chantier demandés", async () => {
      // Given

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          statut: 'PUBLIE',
          perimetre_ids: ['PER-01', 'PER-02'],
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          statut: 'PUBLIE',
          perimetre_ids: ['PER-01'],
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          statut: 'BROUILLON',
          perimetre_ids: ['PER-02'],
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          statut: 'ARCHIVE',
          perimetre_ids: ['PER-03'],
        }, {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          statut: 'SUPPRIME',
          perimetre_ids: ['PER-01', 'PER-03'],
        }],
      });

      const optionsPourExport: OptionsExport = {
        estBarometre: false,
        estTerritorialise: false,
        perimetreIds: [],
        listeChantierId: ['CH-002', 'CH-003', 'CH-005'],
        listeStatuts: [],
      };

      // When
      const result = await prismaChantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(new Habilitation(habilitation), optionsPourExport);

      // Then
      expect(result).toEqual(['CH-002', 'CH-003', 'CH-005']);
    });
  });

  describe('#récupérerLesEntréesDeTousLesChantiersHabilitésNew', () => {
    it('quand on est profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés', async () => {
      // Given
      const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-004'];
      const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

      const filtres: FiltreQueryParams = {
        perimetres: [],
        axes: [],
        statut: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: true,
          est_territorialise: true,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: false,
          est_territorialise: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: false,
          est_territorialise: false,
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-87',
          est_applicable: true,
          taux_avancement_mandat: 5,
        }, {
          id: 'CH-001',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-88',
          est_applicable: true,
          taux_avancement_mandat: 2,
        }, {
          id: 'CH-002',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          est_applicable: true,
          taux_avancement_mandat: 10,
        }, {
          id: 'CH-003',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          meteo: 'COUVERT',
          territoire_code: 'NAT-FR',
          est_applicable: true,
          taux_avancement_mandat: 15,
        }, {
          id: 'CH-004',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          est_applicable: true,
          taux_avancement_mandat: 20,
        }],
      });

      // When
      const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

      // Then
      expect(result).toMatchObject([
        {
          nom: 'Chantier 001',
          chantier_territoire: [
            { territoire_code: 'DEPT-87', taux_avancement_mandat: 5 },
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 2  },
          ],
        }, {
          nom: 'Chantier 002',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 10  },
          ],
        }, {
          nom: 'Chantier 004',
          chantier_territoire: [
            { territoire_code: 'DEPT-87', taux_avancement_mandat: 20 },
          ],
        },
      ]);
      expect(result).not.toMatchObject([
        { territoire_code: 'NAT-FR', taux_avancement_mandat: 20, chantier_identite: { id: 'CH-003' } },
      ]);
    });

    it("quand on n'est pas un profil territoriale et que les filtres sont laissés par défault, doit remonter les chantiers demandés avec la maille nationale en plus", async () => {
      // Given
      const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
      const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

      const filtres: FiltreQueryParams = {
        perimetres: [],
        axes: [],
        statut: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      const profil = ProfilEnum.DITP_ADMIN;

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: true,
          est_territorialise: true,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: false,
          est_territorialise: true,
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-004',
          nom: 'Chantier 004',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: false,
          est_territorialise: false,
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 2,
          est_applicable: true,
        }, {
          id: 'CH-002',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          taux_avancement_mandat: 3,
          est_applicable: true,
        }, {
          id: 'CH-003',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          meteo: 'COUVERT',
          territoire_code: 'NAT-FR',
          taux_avancement_mandat: 4,
          est_applicable: true,
        }, {
          id: 'CH-004',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 5,
          est_applicable: true,
        }],
      });


      // When
      const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

      // Then
      expect(result).toMatchObject([
        {
          nom: 'Chantier 001',
          chantier_territoire: [
            { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
          ],
        }, {
          nom: 'Chantier 003',
          chantier_territoire: [
            { territoire_code: 'NAT-FR', taux_avancement_mandat: 4  },
          ],
        }, {
          nom: 'Chantier 002',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
          ],

        }, {
          nom: 'Chantier 004',
          chantier_territoire: [
            { territoire_code: 'DEPT-87', taux_avancement_mandat: 5 },
          ],
        },
      ]);
    });

    describe('filtres', () => {
      it('quand on est profil territoriale et que le filtres perimetres est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: ['PER-01', 'PER-02'],
          axes: [],
          statut: [],
          estTerritorialise: false,
          estBarometre: false,
          valeurDeLaRecherche: '',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
            perimetre_ids: ['PER-01', 'PER-02'],
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            perimetre_ids: ['PER-01', 'PER-03'],
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            perimetre_ids: ['PER-03', 'PER-04'],
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then

        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
            ],
          }, {
            nom: 'Chantier 003',
            chantier_territoire: [
              { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
            ],
          },
        ]);
      });

      it('quand on est profil territoriale et que le filtres statut est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          statut: ['PUBLIE', 'BROUILLON'],
          estTerritorialise: false,
          estBarometre: false,
          valeurDeLaRecherche: '',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
            statut: 'PUBLIE',
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            statut: 'ARCHIVE',
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            statut: 'BROUILLON',
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
            ],
          }, {
            nom: 'Chantier 002',
            chantier_territoire: [
              { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
            ],
          },
        ]);
      });

      it('quand on est profil territoriale et que le filtres axes est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: ['axe 1', 'axe 2'],
          estTerritorialise: false,
          estBarometre: false,
          valeurDeLaRecherche: '',
          statut: [],
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
            axe: 'axe 3',
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            axe: 'axe 1',
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            axe: 'axe 2',
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([{
          nom: 'Chantier 003',
          chantier_territoire: [
            { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
          ],
        }, {
          nom: 'Chantier 002',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
          ],
        }]);
      });

      it('quand on est profil territoriale et que le filtres est barometre et est territorialise est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          statut: [],
          estTerritorialise: true,
          estBarometre: true,
          valeurDeLaRecherche: '',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-004',
            nom: 'Chantier 004',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: false,
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }, {
            id: 'CH-004',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 5,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
            ],
          }, {
            nom: 'Chantier 003',
            chantier_territoire: [
              { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
            ],
          }, {
            nom: 'Chantier 002',
            chantier_territoire: [
              { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
            ],
          },
        ]);
      });

      it('quand on est profil territoriale et que le filtres est barometre est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          statut: [],
          estTerritorialise: false,
          estBarometre: true,
          valeurDeLaRecherche: '',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-004',
            nom: 'Chantier 004',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: false,
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }, {
            id: 'CH-004',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 5,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
            ],
          }, {
            nom: 'Chantier 002',
            chantier_territoire: [
              { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
            ],
          },
        ]);
      });

      it('quand on est profil territoriale et que le filtres est territorialise est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          statut: [],
          estTerritorialise: true,
          estBarometre: false,
          valeurDeLaRecherche: '',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-004',
            nom: 'Chantier 004',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: false,
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }, {
            id: 'CH-004',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 5,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
            ],
          }, {
            nom: 'Chantier 003',
            chantier_territoire: [
              { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
            ],
          },
        ]);
      });

      it('quand on est profil territoriale et que le filtres valeur de recherche est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          statut: [],
          estTerritorialise: false,
          estBarometre: false,
          valeurDeLaRecherche: 'maValeur recherche',
        };

        const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: true,
          }, {
            id: 'CH-003',
            nom: 'Chantier maValeur recherche 003 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
          }, {
            id: 'CH-002',
            nom: 'Chantier maValeur recherche 002 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-004',
            nom: 'Chantier 004 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: false,
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D88',
            maille: 'DEPT',
            code_insee: '88',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-88',
            taux_avancement_mandat: 3,
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 4,
            est_applicable: true,
          }, {
            id: 'CH-004',
            zone_id: 'R01',
            maille: 'REG',
            code_insee: '01',
            meteo: 'COUVERT',
            territoire_code: 'REG-01',
            taux_avancement_mandat: 5,
            est_applicable: true,
          }],
        });
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres);

        // Then
        expect(result).toMatchObject([{
          nom: 'Chantier maValeur recherche 003 ajout texte pour valeur de recherche',
          chantier_territoire: [
            { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
          ],
        }, {
          nom: 'Chantier maValeur recherche 002 ajout texte pour valeur de recherche',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
          ],
        },
        ]);
      });
    });
  });

  describe('#modifierMétéo', () => {
    it('doit mettre à jour la météo appertenant au chantier territoire', async () => {
      // Given
      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-87',
        }, {
          id: 'CH-001',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
        }, {
          id: 'CH-002',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
        }],
      });
      // When
      await prismaChantierRepository.modifierMétéo('CH-001', 'DEPT-87', 'NUAGE');

      // Then
      const chantier01Dept87 = await prisma.chantier_territoire.findUnique({
        where: {
          id_territoire_code: {
            id: 'CH-001',
            territoire_code: 'DEPT-87',
          },
        },
      });
      const chantier01Dept88 = await prisma.chantier_territoire.findUnique({
        where: {
          id_territoire_code: {
            id: 'CH-001',
            territoire_code: 'DEPT-88',
          },
        },
      });
      const chantier02Dept87 = await prisma.chantier_territoire.findUnique({
        where: {
          id_territoire_code: {
            id: 'CH-002',
            territoire_code: 'DEPT-87',
          },
        },
      });
      expect(chantier01Dept87!.meteo).toStrictEqual('NUAGE');
      expect(chantier01Dept88!.meteo).toStrictEqual('COUVERT');
      expect(chantier02Dept87!.meteo).toStrictEqual('NON_RENSEIGNEE');
    });
  });

  describe('#récupérerPourExports', () => {
    describe('Données des chantiers pour l\'export CSV', () => {
      it('renvoie les bonnes données dans les bons attributs', async () => {
      // Given
        const chantierIdsLecture = ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'];
        const territoireCodesLecture = ['NAT-FR', 'DEPT-01', 'REG-84'];

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            maille: 'REG',
            code_insee: '84',
            territoire_code: 'REG-84',
            zone_id: 'R84',
            taux_avancement_mandat: 20,
            est_applicable: true,
          }, {
            id: 'CH-001',
            maille: 'DEPT',
            code_insee: '01',
            territoire_code: 'DEPT-01',
            zone_id: 'D01',
            taux_avancement_mandat: 30,
            est_applicable: true,
          }, {
            id: 'CH-001',
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
            zone_id: 'FRANCE',
            taux_avancement_mandat: 10,
            est_applicable: true,
          }, {
            id: 'CH-002',
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
            zone_id: 'FRANCE',
            taux_avancement_mandat: 5,
            est_applicable: true,
          }],
        });

        await prisma.chantier_territoire_jalon.createMany({
          data: [{
            id: 'CH-001',
            maille: 'DEPT',
            zone_id: 'D01',
            jalon: 2025,
            code_insee: '01',
            territoire_code: 'DEPT-01',
            taux_avancement: 25,
          }],
        });

        await prisma.commentaire.createMany({ data: [{
          id: 'dcf01b22-9ae9-41a8-8c3f-0996cb15bd52',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          type: 'autres_resultats_obtenus',
          contenu: 'commentaire ARO 1 v1',
          date: new Date(1),
        }, {
          id: 'e32d25df-0077-4ce8-bcf1-b0440a65456e',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          type: 'autres_resultats_obtenus',
          contenu: 'commentaire ARO 1 v2',
          date: new Date(2),
        }, {
          id: '2f18d9ee-405a-48a4-b162-fd6836ec0c43',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          type: 'commentaires_sur_les_donnees',
          contenu: 'commentaire CSLD 1 v1',
          date: new Date(1),
        }, {
          id: '82a7665f-f45b-465b-9889-2e7000890157',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          type: 'commentaires_sur_les_donnees',
          contenu: 'commentaire CSLD 1 v2',
          date: new Date(2),
        }, {
          id: 'af230cf3-eb41-410f-a051-22199cbd7e56',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_venir',
          contenu: 'commentaire AAVN 1 v1',
          date: new Date(1),
        }, {
          id: '8aca154c-680d-4119-aab3-f25a24d872e7',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_venir',
          contenu: 'commentaire AAVN 1 v2',
          date: new Date(2),
        }, {
          id: 'a35c54ce-d8a2-4e24-b2b9-7a91e7ae97ae',
          chantier_id: 'CH-002',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_venir',
          contenu: 'commentaire AAVN 2 v1',
          date: new Date(1),
        }, {
          id: '621fab4a-aed4-41cd-b557-9827af9c80e9',
          chantier_id: 'CH-002',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_venir',
          contenu: 'commentaire AAVN 2 v2',
          date: new Date(2),
        }, {
          id: 'ced97f10-dde9-4ba4-bb15-9fc6145c818f',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_valoriser',
          contenu: 'commentaire AAVL 1 v1',
          date: new Date(1),
        }, {
          id: '2dbaecee-11db-40fd-a1a1-f1e310c067a1',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'actions_a_valoriser',
          contenu: 'commentaire AAVL 1 v2',
          date: new Date(2),
        }, {
          id: '5ab851cc-6273-41e5-9bbd-a6d54d8e3315',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'freins_a_lever',
          contenu: 'commentaire FAL 1 v1',
          date: new Date(1),
        }, {
          id: '4607bb4b-c54c-4b69-a00a-031da7b30420',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'freins_a_lever',
          contenu: 'commentaire FAL 1 v2',
          date: new Date(2),
        }, {
          id: '5f577371-1a0d-4cf2-937b-36c75db86699',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'autres_resultats_obtenus_non_correles_aux_indicateurs',
          contenu: 'commentaire ARONCAI 1 v1',
          date: new Date(1),
        }, {
          id: '41465460-ed59-429e-ad9e-aed4b27b6e19',
          chantier_id: 'CH-001',
          maille: 'NAT',
          code_insee: 'FR',
          territoire_code: 'NAT-FR',
          type: 'autres_resultats_obtenus_non_correles_aux_indicateurs',
          contenu: 'commentaire ARONCAI 1 v2',
          date: new Date(2),
        },
        ] });

        await prisma.objectif.createMany({ data: [{
          id: 'ed221b61-861e-43ae-9b35-0dee6bcaba36',
          type: 'notre_ambition',
          contenu: 'objectif NA 1 v1',
          date: new Date(1),
          chantier_id: 'CH-001',
        }, {
          id: '8ee95d7d-981e-4971-a766-ef285e9706b9',
          type: 'notre_ambition',
          contenu: 'objectif NA 1 v2',
          date: new Date(2),
          chantier_id: 'CH-001',
        }, {
          id: '1223efc6-97f0-4f37-b1b8-23db76d1a3e5',
          type: 'a_faire',
          contenu: 'objectif AF 1 v1',
          date: new Date(1),
          chantier_id: 'CH-001',
        }, {
          id: 'a299ebfe-5927-4d71-a10d-95027760aead',
          type: 'a_faire',
          contenu: 'objectif AF 1 v2',
          date: new Date(2),
          chantier_id: 'CH-001',
        }, {
          id: '77d53a9d-d6c5-45d9-9b9d-a2d72d84fc84',
          type: 'deja_fait',
          contenu: 'objectif DF 1 v1',
          date: new Date(1),
          chantier_id: 'CH-001',
        }, {
          id: '88a6499e-b4b3-4748-8dd0-7e5da6ef479a',
          type: 'deja_fait',
          contenu: 'objectif DF 1 v2',
          date: new Date(2),
          chantier_id: 'CH-001',
        }],
        });

        await prisma.synthese_des_resultats.createMany({ data: [{
          id: 'd014962e-7543-4731-80e7-e0cca44a3918',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          date_commentaire: new Date(1),
          commentaire: 'synthèse des résultats 1 v1',
          meteo: 'COUVERT',
        }, {
          id: '5b79dcdb-6db0-444e-8cd8-0287ee517499',
          chantier_id: 'CH-001',
          maille: 'DEPT',
          code_insee: '01',
          territoire_code: 'DEPT-01',
          date_commentaire: new Date(2),
          commentaire: 'synthèse des résultats 1 v2',
          meteo: 'SOLEIL',
        }] });

        await prisma.decision_strategique.createMany({ data: [{
          id: '44c1b043-e9e4-4528-9a32-87f0097cac57',
          chantier_id: 'CH-001',
          type: 'suivi_des_decisions',
          contenu: 'decision_strategique 1 v1',
          date: new Date(1),
        }, {
          id: '3f85994e-5ad3-4a58-a230-f6c66bde409c',
          chantier_id: 'CH-001',
          type: 'suivi_des_decisions',
          contenu: 'decision_strategique 1 v2',
          date: new Date(2),
        }] });

        // When
        const result = await prismaChantierRepository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

        // Then
        expect(result).toPartiallyContain({
          nom: 'Chantier 001',
          maille: 'NAT',
          commActionsÀVenir: 'commentaire AAVN 1 v2',
          commActionsÀValoriser: 'commentaire AAVL 1 v2',
          commFreinsÀLever: 'commentaire FAL 1 v2',
          commCommentairesSurLesDonnées: null,
          commAutresRésultats: null,
          commAutresRésultatsNonCorrélésAuxIndicateurs: 'commentaire ARONCAI 1 v2',
          objNotreAmbition: 'objectif NA 1 v2',
          objDéjàFait: 'objectif DF 1 v2',
          objÀFaire: 'objectif AF 1 v2',
          decStratSuiviDesDécisions: 'decision_strategique 1 v2',
        });
        expect(result).toPartiallyContain({
          nom: 'Chantier 001', maille: 'REG',
        });
        expect(result).toPartiallyContain({
          nom: 'Chantier 001',
          id: 'CH-001',
          maille: 'DEPT',
          régionNom: 'Auvergne-Rhône-Alpes',
          départementNom: 'Ain',
          ministèreNom: 'MINA',
          estBaromètre: true,
          estTerritorialisé: false,
          tauxDAvancementAnnuel: 25,
          tauxDAvancementNational: 10,
          tauxDAvancementRégional: 20,
          tauxDAvancementDépartemental: 30,
          météo: 'SOLEIL',
          commActionsÀVenir: null,
          commActionsÀValoriser: null,
          commFreinsÀLever: null,
          commCommentairesSurLesDonnées: 'commentaire CSLD 1 v2',
          commAutresRésultats: 'commentaire ARO 1 v2',
          commAutresRésultatsNonCorrélésAuxIndicateurs: null,
          decStratSuiviDesDécisions: null,
          objNotreAmbition: null,
          objDéjàFait: null,
          objÀFaire: null,
          synthèseDesRésultats: 'synthèse des résultats 1 v2',
        });
      });

      it('renvoie seulement les données pour les chantiers et territoires habilités', async () => {
      // Given
        const chantierIdsLecture = ['CH-001', 'CH-003'];
        const territoireCodesLecture = ['DEPT-01', 'REG-11'];

        await prisma.chantier_identite.createMany({
          data: [{
            id: 'CH-001',
            nom: 'Chantier 001',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
          }],
        });

        await prisma.chantier_territoire.createMany({
          data: [{
            id: 'CH-001',
            zone_id: 'D26',
            maille: 'DEPT',
            code_insee: '01',
            territoire_code: 'DEPT-01',
            est_applicable: true,
          }, {
            id: 'CH-001',
            zone_id: 'R84',
            maille: 'REG',
            code_insee: '84',
            territoire_code: 'REG-84',
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D26',
            maille: 'DEPT',
            code_insee: '26',
            territoire_code: 'DEPT-26',
            est_applicable: true,
          }, {
            id: 'CH-001',
            zone_id: 'FRANCE',
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'R11',
            maille: 'REG',
            code_insee: '11',
            territoire_code: 'REG-11',
            est_applicable: true,
          }, {
            id: 'CH-003',
            zone_id: 'FRANCE',
            maille: 'NAT',
            code_insee: 'FR',
            territoire_code: 'NAT-FR',
            est_applicable: true,
          }],
        });

        // When
        const result = await prismaChantierRepository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

        // Then
        expect(result).toHaveLength(2);
        expect(result).toPartiallyContain({
          nom: 'Chantier 001',
          maille: 'DEPT',
        });
        expect(result).toPartiallyContain({
          nom: 'Chantier 003',
          maille: 'REG',
        });
      });
    });
  });

  describe('#getChantierStatistiques', () => {
    it("quand le nombre de territoire demandé est pair, doit récupérer les statistiques d'une liste de chantier", async () => {
      // Given
      const listeChantierIds = ['CH-001', 'CH-002'];

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 10,
        }, {
          id: 'CH-001',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          taux_avancement_mandat: 12,
        }, {
          id: 'CH-002',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 14,
        }, {
          id: 'CH-002',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          taux_avancement_mandat: 16,
        }, {
          id: 'CH-002',
          zone_id: 'RO1',
          maille: 'REG',
          code_insee: '01',
          meteo: 'COUVERT',
          territoire_code: 'REG-01',
          taux_avancement_mandat: 50,
        }, {
          id: 'CH-003',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 18,
        }],
      });
      // When
      const result = await prismaChantierRepository.getChantierStatistiques(habilitation, listeChantierIds, 'departementale');

      // Then
      expect(result).toEqual({
        global: {
          moyenne: 13,
          médiane: 13,
          maximum: 14,
          minimum: 12,
        },
        annuel: {
          moyenne: null,
        },
      });
    });

    it("quand le nombre de territoire demandé est impair, doit récupérer les statistiques d'une liste de chantier", async () => {
      // Given
      const listeChantierIds = ['CH-001', 'CH-002'];

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      await prisma.chantier_identite.createMany({
        data: [{
          id: 'CH-001',
          nom: 'Chantier 001',
        }, {
          id: 'CH-002',
          nom: 'Chantier 002',
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
        }],
      });

      await prisma.chantier_territoire.createMany({
        data: [{
          id: 'CH-001',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'SOLEIL',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 10,
        }, {
          id: 'CH-001',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          taux_avancement_mandat: 12,
        }, {
          id: 'CH-001',
          zone_id: 'D89',
          maille: 'DEPT',
          code_insee: '89',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-89',
          taux_avancement_mandat: 22,
        }, {
          id: 'CH-002',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 14,
        }, {
          id: 'CH-002',
          zone_id: 'D88',
          maille: 'DEPT',
          code_insee: '88',
          meteo: 'COUVERT',
          territoire_code: 'DEPT-88',
          taux_avancement_mandat: 16,
        }, {
          id: 'CH-002',
          zone_id: 'RO1',
          maille: 'REG',
          code_insee: '01',
          meteo: 'COUVERT',
          territoire_code: 'REG-01',
          taux_avancement_mandat: 50,
        }, {
          id: 'CH-003',
          zone_id: 'D87',
          maille: 'DEPT',
          code_insee: '87',
          meteo: 'NON_RENSEIGNEE',
          territoire_code: 'DEPT-87',
          taux_avancement_mandat: 18,
        }],
      });
      // When
      const result = await prismaChantierRepository.getChantierStatistiques(habilitation, listeChantierIds, 'departementale');

      // Then
      expect(result).toEqual({
        global: {
          moyenne: 16,
          médiane: 14,
          maximum: 22,
          minimum: 12,
        },
        annuel: {
          moyenne: null,
        },
      });
    });
  });
});
