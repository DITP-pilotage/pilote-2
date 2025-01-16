import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
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
          }, {
            id: 'CH-002',
            nom: 'Chantier 002',
            ministeres: ['1009'],
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

        const commentaireBuilder = new CommentaireRowBuilder().avecChantierId('CH-001');
        const commentaire2Builder = new CommentaireRowBuilder().avecChantierId('CH-002');

        await prisma.commentaire.createMany({ data: [
          commentaireBuilder.shallowCopy()
            .avecMaille('DEPT').avecCodeInsee('01')
            .avecType('autres_resultats_obtenus')
            .avecContenu('commentaire ARO 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('DEPT').avecCodeInsee('01')
            .avecType('autres_resultats_obtenus')
            .avecContenu('commentaire ARO 1 v2')
            .avecDate(new Date(2))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('DEPT').avecCodeInsee('01')
            .avecType('commentaires_sur_les_donnees')
            .avecContenu('commentaire CSLD 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('DEPT').avecCodeInsee('01')
            .avecType('commentaires_sur_les_donnees')
            .avecContenu('commentaire CSLD 1 v2')
            .avecDate(new Date(2))
            .build(),

          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('actions_a_venir')
            .avecContenu('commentaire AAVN 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaire2Builder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('actions_a_venir')
            .avecContenu('commentaire AAVN 2 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('actions_a_venir')
            .avecContenu('commentaire AAVN 1 v2')
            .avecDate(new Date(2))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('actions_a_valoriser')
            .avecContenu('commentaire AAVL 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('actions_a_valoriser')
            .avecContenu('commentaire AAVL 1 v2')
            .avecDate(new Date(2))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('freins_a_lever')
            .avecContenu('commentaire FAL 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('freins_a_lever')
            .avecContenu('commentaire FAL 1 v2')
            .avecDate(new Date(2))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('autres_resultats_obtenus_non_correles_aux_indicateurs')
            .avecContenu('commentaire ARONCAI 1 v1')
            .avecDate(new Date(1))
            .build(),
          commentaireBuilder.shallowCopy()
            .avecMaille('NAT').avecCodeInsee('FR')
            .avecType('autres_resultats_obtenus_non_correles_aux_indicateurs')
            .avecContenu('commentaire ARONCAI 1 v2')
            .avecDate(new Date(2))
            .build(),
        ] });

        const objectifBuilder = new ObjectifSQLRowBuilder()
          .avecChantierId('CH-001')
          .avecType('notre_ambition')
          .avecContenu('objectif NA 1 v1')
          .avecDate(new Date(1));
        await prisma.objectif.createMany({ data: [
          objectifBuilder.build(),
          objectifBuilder.shallowCopy()
            .avecType('notre_ambition')
            .avecContenu('objectif NA 1 v2')
            .avecDate(new Date(2))
            .build(),
          objectifBuilder.shallowCopy()
            .avecType('a_faire')
            .avecContenu('objectif AF 1 v1')
            .avecDate(new Date(1))
            .build(),
          objectifBuilder.shallowCopy()
            .avecType('a_faire')
            .avecContenu('objectif AF 1 v2')
            .avecDate(new Date(2))
            .build(),
          objectifBuilder.shallowCopy()
            .avecType('deja_fait')
            .avecContenu('objectif DF 1 v1')
            .avecDate(new Date(1))
            .build(),
          objectifBuilder.shallowCopy()
            .avecType('deja_fait')
            .avecContenu('objectif DF 1 v2')
            .avecDate(new Date(2))
            .build(),
        ] });

        await prisma.synthese_des_resultats.createMany({ data: [
          new SyntheseDesResultatsRowBuilder()
            .avecChantierId('CH-001')
            .avecMaille('DEPT')
            .avecCodeInsee('01')
            .avecDateCommentaire(new Date(1))
            .avecCommentaire('synthèse des résultats 1 v1')
            .avecMétéo('COUVERT')
            .build(),
          new SyntheseDesResultatsRowBuilder()
            .avecChantierId('CH-001')
            .avecMaille('DEPT')
            .avecCodeInsee('01')
            .avecDateCommentaire(new Date(2))
            .avecCommentaire('synthèse des résultats 1 v2')
            .avecMétéo('SOLEIL')
            .build(),
        ] });

        // When
        const result = await prismaChantierRepository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            nom: 'chantier 1',
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
          }),
          expect.objectContaining({ nom: 'chantier 1', maille: 'REG' }),
          expect.objectContaining({
            nom: 'chantier 1',
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
          }),
          expect.objectContaining({ nom: 'chantier 2' }),
        ]);
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
