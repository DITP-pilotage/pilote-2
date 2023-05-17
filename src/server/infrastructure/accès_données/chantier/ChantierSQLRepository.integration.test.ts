import { chantier } from '@prisma/client';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { objectEntries } from '@/client/utils/objects/objects';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import ChantierSQLRepository from './ChantierSQLRepository';

describe('ChantierSQLRepository', () => {
  test('Accède à un chantier par son id, vérification de quelques champs', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecMaille('NAT')
          .avecId('CH-001').avecNom('Chantier 1').avecAxe('Axe 1').avecPpg('Ppg 1')
          .avecPérimètreIds(['PER-001', 'PER-002']).avecMétéo('COUVERT')
          .avecDirecteursAdminCentrale(['Alain Térieur', 'Alex Térieur'])
          .avecDirectionsAdminCentrale(['Intérieur', 'Extérieur'])
          .avecDirecteursProjet(['Dir proj 1', 'Dir proj 2'])
          .avecDirecteursProjetMails(['dirproj1@example.com', 'dirproj2@example.com'])
          .avecEstTerritorialisé(true)
          .build(),
        new ChantierSQLRowBuilder()
          .avecMaille('NAT')
          .avecId('CH-002').avecNom('Chantier 2').build(),
      ],
    });
    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result1 = await repository.récupérer('CH-001', habilitation);
    const result2 = await repository.récupérer('CH-002', habilitation);

    // THEN
    expect(result1.nom).toEqual('Chantier 1');
    expect(result1.axe).toStrictEqual('Axe 1');
    expect(result1.ppg).toStrictEqual('Ppg 1');
    expect(result1.périmètreIds).toStrictEqual(['PER-001', 'PER-002']);
    expect(result1.mailles.nationale.FR.météo).toEqual('COUVERT');
    expect(result1.responsables.directeursAdminCentrale).toStrictEqual([{ nom: 'Alain Térieur', direction: 'Intérieur' }, { nom: 'Alex Térieur', direction: 'Extérieur' }]);
    expect(result1.responsables.directeursProjet).toStrictEqual([{ nom: 'Dir proj 1', email: 'dirproj1@example.com' }, { nom: 'Dir proj 2', email: 'dirproj2@example.com' }]);
    expect(result1.estTerritorialisé).toStrictEqual(true);

    expect(result2.nom).toEqual('Chantier 2');
  });

  test('un chantier sans ministères est exclu du résultat', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecTauxAvancement(18).avecMinistères([]).build(),
    });

    const habilitations = new Habilitation(habilitation);
    // WHEN
    const result = await repository.récupérerListe(habilitations);

    // THEN
    expect(result).toStrictEqual([]);
  });

  test('un chantier contenant une maille nationale et départementale', async () => {
    // GIVEN
    const chantierId = 'CH-001';
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('NAT').avecMétéo('SOLEIL').avecTauxAvancement(18).build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId).avecMaille('DEPT').avecMétéo('SOLEIL').avecCodeInsee('13').avecTauxAvancement(45).build(),
      ],
    });
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR', 'DEPT-13'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await repository.récupérer(chantierId, habilitation);

    // THEN
    expect(result.mailles.nationale).toStrictEqual({
      FR: {
        codeInsee: 'FR',
        avancement: { annuel: null, global: 18 },
        météo: 'SOLEIL',
      },
    });

    expect(result.mailles.départementale[13]).toStrictEqual({
      codeInsee: '13',
      avancement: { annuel: null, global: 45 },
      météo: 'SOLEIL',
    });

    expect(result.mailles.départementale[12]).toStrictEqual({
      codeInsee: '12',
      avancement: { annuel: null, global: null },
      météo: 'NON_RENSEIGNEE',
    });

    expect(objectEntries(result.mailles.départementale)).toHaveLength(101);
    expect(objectEntries(result.mailles.régionale)).toHaveLength(18);
  });

  test('Contient des porteurs et des coporteurs', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecNom('Chantier 1')
          .avecMaille('NAT')
          .avecMinistères(['Agriculture et Alimentation', 'Intérieur', 'Extérieur'])
          .build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecNom('Chantier 2')
          .avecMaille('NAT')
          .avecMinistères(['Agriculture et Alimentation'])
          .build(),
      ],
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result1 = await repository.récupérer('CH-001', habilitation);
    const result2 = await repository.récupérer('CH-002', habilitation);

    // THEN
    expect(result1.responsables.porteur).toEqual('Agriculture et Alimentation');
    expect(result1.responsables.coporteurs).toEqual(['Intérieur', 'Extérieur']);

    expect(result2.responsables.porteur).toEqual('Agriculture et Alimentation');
    expect(result2.responsables.coporteurs).toEqual([]);
  });

  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('NAT').build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecMaille('NAT').avecTauxAvancement(50).build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-002').avecMaille('DEPT').avecCodeInsee('13').avecTauxAvancement(50).build(),
      ],
    });
    
    const habilitation = { lecture: {
      chantiers: ['CH-001', 'CH-002'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const habilitations = new Habilitation(habilitation);
    const chantiers = await repository.récupérerListe(habilitations);

    // THEN
    const ids = chantiers.map(ch => ch.id);
    expect(ids).toStrictEqual(['CH-001', 'CH-002']);
    expect(chantiers[1].mailles.nationale.FR.avancement.global).toBe(50);
  });

  test('Un code insee sur trois caractères fonctionne', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);
    await prisma.chantier.createMany({
      data: [
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('NAT').build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-001').avecMaille('DEPT').avecCodeInsee('974').build(),
      ],
    });
    
    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const habilitations = new Habilitation(habilitation);
    const chantiers = await repository.récupérerListe(habilitations);

    // THEN
    expect(chantiers[0].mailles.départementale['974']).toBeDefined();
  });

  test('Un directeur de projet peut ne pas avoir d\'adresse email', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecDirecteursProjet(['Jean Bon']).avecDirecteursProjetMails([]).build(),
    });

    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await repository.récupérer(chantierId, habilitation);

    // THEN
    expect(result.responsables.directeursProjet[0]).toStrictEqual({ nom: 'Jean Bon', email: null });
  });

  test('Un chantier est du baromètre', async () => {
    // GIVEN
    const repository: ChantierRepository = new ChantierSQLRepository(prisma);

    const chantierId = 'CH-001';

    await prisma.chantier.create({
      data: new ChantierSQLRowBuilder()
        .avecId(chantierId).avecMaille('NAT').avecEstBaromètre(true).build(),
    });
    
    const habilitation = { lecture: {
      chantiers: ['CH-001'],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    // WHEN
    const result = await repository.récupérer(chantierId, habilitation);

    // THEN
    expect(result.estBaromètre).toBe(true);
  });

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
        await repository.récupérer('CH-002', habilitation);
      };

      // THEN
      await expect(request).rejects.toThrow(/chantier 'CH-002' non trouvé/);
    });

    test('Erreur en cas d\'absence de maille nationale', async () => {
    // GIVEN
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);
      const chantierId = 'CH-001';
      await prisma.chantier.create({
        data: new ChantierSQLRowBuilder().avecId(chantierId).avecMaille('DEPT').avecCodeInsee('12').build(),
      });
      
      const habilitation = { lecture: {

        chantiers: ['CH-001'],
        territoires: ['NAT-FR', 'DEPT-12'],
      } } as unknown as Utilisateur['habilitations'];

      // WHEN
      const request = async () => {
        await repository.récupérer(chantierId, habilitation);
      };

      // THEN
      await expect(request).rejects.toThrow(/le chantier 'CH-001' n'a pas de maille nationale/);
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

      const habilitation = { lecture: {
        chantiers: ['CH-001', 'CH-002', 'CH-003', 'CH-004', 'CH-005'],
        territoires: ['NAT-FR'],
      } } as unknown as Utilisateur['habilitations'];

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
        new ChantierSQLRowBuilder().avecId('CH-002').avecNom('chantier 2').build(),
        new ChantierSQLRowBuilder().avecId('CH-003').avecNom('chantier 3').build(),
        new ChantierSQLRowBuilder().avecId('CH-004').avecNom('chantier 4').build(),
        new ChantierSQLRowBuilder().avecId('CH-005').avecNom('chantier 5').build(),
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
      const result = await repository.récupérerPourExports(habilitation);

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
  });
});
