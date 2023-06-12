import { chantier } from '@prisma/client';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {

  describe("Gestion d'erreur", () => {
    test('Erreur en cas de chantier non trouvé', async () => {
      // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.create({
        data: new ChantierSQLRowBuilder().avecId(chantierId).avecMaille('NAT').build(),
      });

      const habilitation = { lecture: {

        chantiers: ['CH-001', 'CH-002'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      const request = async () => {
        await repository.récupérerLesEntréesDUnChantier('CH-002', habilitation);
      };

      // THEN
      await expect(request).rejects.toThrow(/chantier 'CH-002' non trouvé/);
    });
  });

  describe('récupérerParIdEtTerritoire', function () {
    test('renvoie la météo pour un chantier et territoire donné', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];

      await prisma.chantier.createMany({ data: chantiers });

      // When
      const result = await repository.récupérerMétéoParChantierIdEtTerritoire(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual('ORAGE');
    });
  });

  describe('Données des chantiers pour l\'export CSV', () => {
    it('renvoie les bonnes données dans les bons attributs', async () => {
      // Given
      const repository = new ChantierSQLRepository(prisma);

      const chantierIdsLecture = ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'];
      const territoireCodesLecture = ['NAT-FR', 'DEPT-01', 'REG-84'];

      const chantier001Builder = new ChantierSQLRowBuilder()
        .avecId('CH-001')
        .avecNom('chantier 1')
        .avecMaille('DEPT')
        .avecCodeInsee('01')
        .avecTauxAvancement(30)
        .avecMinistères(['MIN a', 'MIN b'])
        .avecEstBaromètre(true)
        .avecEstTerritorialisé(false);

      await prisma.chantier.createMany({ data: [
        chantier001Builder.build(),
        chantier001Builder.shallowCopy()
          .avecMaille('REG')
          .avecCodeInsee('84')
          .avecTauxAvancement(20)
          .build(),
        chantier001Builder.shallowCopy()
          .avecMaille('NAT')
          .avecCodeInsee('FR')
          .avecTauxAvancement(10)
          .build(),
        new ChantierSQLRowBuilder().avecId('CH-002').avecNom('chantier 2').avecMaille('NAT').avecCodeInsee('FR').build(),
        new ChantierSQLRowBuilder().avecId('CH-003').avecNom('chantier 3').avecMaille('NAT').avecCodeInsee('FR').build(),
        new ChantierSQLRowBuilder().avecId('CH-004').avecNom('chantier 4').avecMaille('NAT').avecCodeInsee('FR').build(),
        new ChantierSQLRowBuilder().avecId('CH-005').avecNom('chantier 5').avecMaille('NAT').avecCodeInsee('FR').build(),
      ] });

      const commentaireBuilder = new CommentaireRowBuilder()
        .avecChantierId('CH-001');
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
      const result = await repository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

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
          maille: 'DEPT',
          régionNom: 'Auvergne-Rhône-Alpes',
          départementNom: 'Ain',
          ministèreNom: 'MIN a',
          estBaromètre: true,
          estTerritorialisé: false,
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
        expect.objectContaining({ nom: 'chantier 3' }),
        expect.objectContaining({ nom: 'chantier 4' }),
        expect.objectContaining({ nom: 'chantier 5' }),
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

      const repository = new ChantierSQLRepository(prisma);

      const chantierIdsLecture = ['CH-001'];
      const territoireCodesLecture = [territoireHabilité.code];

      const chantiersHabilités = [
        new ChantierSQLRowBuilder()
          .avecId('CH-001')
          .avecNom('chantier 1')
          .avecMaille(territoireHabilité.maille)
          .avecCodeInsee(territoireHabilité.codeInsee)
          .build(),
      ];

      const chantiersNonHabilités = [
        new ChantierSQLRowBuilder()
          .avecId('CH-002')
          .avecNom('chantier 2')
          .avecMaille(territoireHabilité.maille)
          .avecCodeInsee(territoireHabilité.codeInsee)
          .build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-001')
          .avecNom('chantier 1')
          .avecMaille('REG')
          .avecCodeInsee('84')
          .build(),
      ];

      await prisma.chantier.createMany({ data: [
        ...chantiersHabilités,
        ...chantiersNonHabilités,
      ] });

      // When
      const result = await repository.récupérerPourExports(chantierIdsLecture, territoireCodesLecture);

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
