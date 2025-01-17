import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { prisma } from '@/server/db/prisma';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  let prismaChantierRepository: ChantierSQLRepository;

  beforeEach(() => {
    prismaChantierRepository = new ChantierSQLRepository();
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

      const profil = ProfilEnum.COORDINATEUR_DEPARTEMENT;

      // When
      const listeChantier = await prismaChantierRepository.récupérerLesEntréesDUnChantier('CH-001', habilitation, profil);

      // Then
      expect(listeChantier).toHaveLength(1);
      expect(listeChantier.at(0)?.nom).toEqual('Chantier 001');
      expect(listeChantier.at(0)?.chantier_territoire[0].territoire_code).toEqual('DEPT-87');
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
      expect(listeChantier).toHaveLength(1);
      expect(listeChantier.at(0)?.nom).toEqual('Chantier 001');
      expect(listeChantier.at(0)?.chantier_territoire).toHaveLength(2);
      expect(listeChantier.at(0)?.chantier_territoire).toMatchObject([{
        territoire_code: 'DEPT-87',
      }, {
        territoire_code: 'NAT-FR',
      }]);
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
          data: [
            {
              id: 'CH-001',
              maille: 'DEPT',
              jalon: '2025',
              code_insee: '01',
              territoire_code: 'DEPT-01',
              taux_avancement: 25,
            },
          ],
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
        const territoireHabilité = {
          code: 'DEPT-26',
          maille: 'DEPT',
          codeInsee: '26',
          nom: 'Drôme',
        };

        const chantierIdsLecture = ['CH-001'];
        const territoireCodesLecture = [territoireHabilité.code];

        const chantiersHabilités = [
          new ChantierSQLRowBuilder()
            .avecId('CH-001')
            .avecNom('chantier 1')
            .avecMaille(territoireHabilité.maille)
            .avecCodeInsee(territoireHabilité.codeInsee)
            .avecEstApplicable(true)
            .build(),
        ];

        const chantiersNonHabilités = [
          new ChantierSQLRowBuilder()
            .avecId('CH-002')
            .avecNom('chantier 2')
            .avecMaille(territoireHabilité.maille)
            .avecCodeInsee(territoireHabilité.codeInsee)
            .avecEstApplicable(true)
            .build(),
          new ChantierSQLRowBuilder()
            .avecId('CH-001')
            .avecNom('chantier 1')
            .avecMaille('REG')
            .avecCodeInsee('84')
            .avecEstApplicable(true)
            .build(),
        ];

        await prisma.chantier.createMany({ data: [
          ...chantiersHabilités,
          ...chantiersNonHabilités,
        ] });

        // When
        const result = await prismaChantierRepository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            nom: 'chantier 1',
            maille: territoireHabilité.maille,
            départementNom: territoireHabilité.nom,
          }),
        ]);

      });
    });
  });
});
