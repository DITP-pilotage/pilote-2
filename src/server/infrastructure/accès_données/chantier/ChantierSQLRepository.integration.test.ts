import { chantier_territoire_jalon } from '@prisma/client';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { prisma } from '@/server/db/prisma';
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
        territoiresApplicables: expect.arrayContaining(['REG-84', 'DEPT-01', 'NAT-FR']),
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
        await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-002', habilitation, profil, 2024);
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
      const listeChantier = await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-001', habilitation, profil, 2024);

      // Then
      expect(listeChantier.nom).toEqual('Chantier 001');
      expect(listeChantier.chantier_territoire.map(chantierTerritoire => chantierTerritoire.territoire_code)).toContainEqual('DEPT-87');
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
          chantier_territoire_jalon: {
            createMany: {
              data: [{
                code_insee: '87',
                maille: 'DEPT',
                zone_id: 'D87',
                jalon: 2024,
                taux_avancement: 10,
              }, {
                code_insee: '87',
                maille: 'DEPT',
                zone_id: 'D87',
                jalon: 2025,
                taux_avancement: 12,
              }],
            },
          },
        },
      });

      await prisma.chantier_territoire.create({
        data: {
          id: 'CH-001',
          code_insee: '88',
          maille: 'DEPT',
          zone_id: 'D88',
          territoire_code: 'DEPT-88',
          chantier_territoire_jalon: {
            createMany: {
              data: [{
                code_insee: '88',
                maille: 'DEPT',
                zone_id: 'D88',
                jalon: 2024,
                taux_avancement: 10,
              }, {
                code_insee: '88',
                maille: 'DEPT',
                zone_id: 'D88',
                jalon: 2025,
                taux_avancement: 12,
              }],
            },
          },
        },
      });

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002'],
        territoires: ['DEPT-87'],
      } } as unknown as Utilisateur['habilitations'];

      const profil = ProfilEnum.DITP_ADMIN;

      // When
      const listeChantier = await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-001', habilitation, profil, 2024);

      // Then
      expect(listeChantier.nom).toEqual('Chantier 001');
      expect(listeChantier.chantier_territoire).toHaveLength(2);
      expect(listeChantier.chantier_territoire.map(chantierTerritoire => chantierTerritoire.territoire_code)).toIncludeAllMembers(['NAT-FR', 'DEPT-87']);
      expect(listeChantier.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === 'DEPT-87')?.chantier_territoire_jalon).toIncludeAllPartialMembers<Partial<chantier_territoire_jalon>>([{
        taux_avancement: 10,
      }]);
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
        meteos: [],
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
      const jalon = 2024;

      // When
      const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
        meteos: [],
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
          id: 'CH-002',
          nom: 'Chantier 002',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: true,
          est_territorialise: false,
        }, {
          id: 'CH-003',
          nom: 'Chantier 003',
          ministeres: ['1009'],
          ministeres_acronymes: ['MINA'],
          est_barometre: false,
          est_territorialise: true,
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
          id: 'CH-003',
          zone_id: 'FRANCE',
          maille: 'NAT',
          code_insee: 'FR',
          meteo: 'COUVERT',
          territoire_code: 'NAT-FR',
          taux_avancement_mandat: 4,
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

      const jalon = 2024;

      // When
      const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
        }, {
          nom: 'Chantier 003',
          chantier_territoire: [
            { territoire_code: 'NAT-FR', taux_avancement_mandat: 4  },
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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            perimetre_ids: ['PER-03', 'PER-04'],
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            perimetre_ids: ['PER-01', 'PER-03'],
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
        const jalon = 2024;

        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            statut: 'BROUILLON',
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            statut: 'ARCHIVE',
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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

      it('quand on est profil territoriale et que le filtres meteos est defini, doit remonter les chantiers demandés', async () => {
        // Given
        const chantiersLectureIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
        const territoiresLectureIds = ['DEPT-87', 'DEPT-88', 'REG-01'];

        const filtres: FiltreQueryParams = {
          perimetres: [],
          axes: [],
          meteos: ['SOLEIL'],
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
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'SOLEIL',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 2,
            est_applicable: true,
          }, {
            id: 'CH-002',
            zone_id: 'D87',
            maille: 'DEPT',
            code_insee: '87',
            meteo: 'COUVERT',
            territoire_code: 'DEPT-87',
            taux_avancement_mandat: 3,
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

        // Then
        expect(result).toMatchObject([
          {
            nom: 'Chantier 001',
            chantier_territoire: [
              { territoire_code: 'DEPT-87', taux_avancement_mandat: 2 },
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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
            axe: 'axe 2',
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
            axe: 'axe 1',
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

        // Then
        expect(result).toMatchObject([{
          nom: 'Chantier 002',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
          ],
        }, {
          nom: 'Chantier 003',
          chantier_territoire: [
            { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
          }, {
            nom: 'Chantier 003',
            chantier_territoire: [
              { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            nom: 'Chantier 003',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

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
          meteos: [],
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
            id: 'CH-002',
            nom: 'Chantier maValeur recherche 002 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: true,
            est_territorialise: false,
          }, {
            id: 'CH-003',
            nom: 'Chantier maValeur recherche 003 ajout texte pour valeur de recherche',
            ministeres: ['1009'],
            ministeres_acronymes: ['MINA'],
            est_barometre: false,
            est_territorialise: true,
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

        const jalon = 2024;
      
        // When
        const result = await prismaChantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds, territoiresLectureIds, profil, filtres, 'DEPT-87', jalon);

        // Then
        expect(result).toMatchObject([{
          nom: 'Chantier maValeur recherche 002 ajout texte pour valeur de recherche',
          chantier_territoire: [
            { territoire_code: 'DEPT-88', taux_avancement_mandat: 3  },
          ],
        }, {
          nom: 'Chantier maValeur recherche 003 ajout texte pour valeur de recherche',
          chantier_territoire: [
            { territoire_code: 'REG-01', taux_avancement_mandat: 4  },
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

  describe('#recupererLaRepartitionMeteo', () => {
    it("quand on a l'option estBarometre et estTerritorialise à true, doit remonter la répartition météo des chantiers qui sont soit du barometre soit territorialisés", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: true,
        estBarometre: true,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(2);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(0);
    });

    it('quand on a le filtre estBarometre a true et estTerritorialise à false, doit remonter la répartition météo pour les chantiers du barometre', async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: false,
        estBarometre: true,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(1);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(0);
    });

    it("quand on a l'option estBarometre est a false et estTerritorialise à true, doit remonter les chantiers ids contenant les chantiers territorialise", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'NUAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: true,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(0);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(1);
    });

    it('quand on a le filtre statut est défini, doit remonter la répartition météo des chantiers avec les statuts demandés', async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          statut: 'PUBLIE',
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          statut: 'PUBLIE',
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          statut: 'BROUILLON',
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          statut: 'ARCHIVE',
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          statut: 'SUPPRIME',
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: ['PUBLIE', 'BROUILLON'],
        meteos: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(2);
      expect(result.nombreSoleil).toEqual(0);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(1);
    });

    it("quand on a l'option perimetreIds est définie, doit remonter les répartions météo des chantiers avec les périmètres demandés", async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01', 'PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-03'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01', 'PER-03'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: ['PER-01', 'PER-02'],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(1);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(2);
    });

    it('doit retourner la répartition météo des chantiers ids demandés', async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01', 'PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'SOLEIL',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-03'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-005',
          nom: 'Chantier 005',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-03'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-003', 'CH-005'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(1);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(1);
    });
    it('doit retourner la répartition météo des chantiers uniquement sur les territoires demandés', async () => {
      // Given
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-001',
          nom: 'Chantier 001',
          est_barometre: true,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01', 'PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                territoire_code: 'NAT-FR',
                maille: 'NAT',
                zone_id: 'FRANCE',
                meteo: 'SOLEIL',
                est_applicable: true,
              }, {
                code_insee: '34',
                territoire_code: 'DEPT-34',
                maille: 'DEPT',
                zone_id: 'D34',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-002',
          nom: 'Chantier 002',
          est_barometre: true,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-01'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });
      await prisma.chantier_identite.create({
        data: {
          id: 'CH-003',
          nom: 'Chantier 003',
          est_barometre: false,
          est_territorialise: true,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-02'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'ORAGE',
                est_applicable: true,
              }],
            },
          },
        },
      });

      await prisma.chantier_identite.create({
        data: {
          id: 'CH-004',
          nom: 'Chantier 004',
          est_barometre: false,
          est_territorialise: false,
          ministeres: ['MINA'],
          perimetre_ids: ['PER-03'],
          chantier_territoire: {
            createMany: {
              data: [{
                code_insee: 'FR',
                zone_id: 'FRANCE',
                maille: 'NAT',
                territoire_code: 'NAT-FR',
                meteo: 'COUVERT',
                est_applicable: true,
              }],
            },
          },
        },
      });

      const filtres = {
        perimetres: [],
        axes: [],
        statut: [],
        meteos: [],
        estTerritorialise: false,
        estBarometre: false,
        valeurDeLaRecherche: '',
      };

      // When
      const result = await prismaChantierRepository.recupererLaRepartitionMeteo(['CH-001', 'CH-002', 'CH-003', 'CH-004'], 'NAT-FR', filtres);

      // Then
      expect(result.nombreCouvert).toEqual(1);
      expect(result.nombreSoleil).toEqual(1);
      expect(result.nombreNuage).toEqual(0);
      expect(result.nombreOrage).toEqual(2);
    });
  });
});
