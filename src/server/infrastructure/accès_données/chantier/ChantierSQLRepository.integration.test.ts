import { chantier, commentaire } from '@prisma/client';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import ObjectifSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ObjectifSQLRow.builder';
import IndicateurRowBuilder from '@/server/infrastructure/test/builders/sqlRow/IndicateurSQLRow.builder';
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

      const profil = 'DITP_ADMIN';

      // WHEN
      const request = async () => {
        await repository.récupérerLesEntréesDUnChantier('CH-002', habilitation, profil);
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

  describe('récupérerDatesDeMiseÀJour', () => {
    describe('renvoie un objet vide quand les habilitations sont insuffisantes', () => {
      test.each([
        [[], []],
        [['CH-001'], []],
        [[], ['REG-01']],
        [['CH-non-existant'], ['REG-01']],
        [['CH-001'], ['DEPT-non-existant']],
        [['CH-non-existant'], ['DEPT-non-existant']],
      ])('habilitation: [chantierId: %s, territoireCode: %s]', async (chantierIdsHabilités, territoireCodesHabilités) => {
        // Given
        const chantierId = 'CH-001';
        const maille = 'régionale';
        const codeInsee = '01';
        const territoireCode = 'REG-01';
        const repository: ChantierRepository = new ChantierSQLRepository(prisma);

        const chantiers: chantier[] = [
          new ChantierSQLRowBuilder()
            .avecId(chantierId)
            .avecMaille(CODES_MAILLES[maille])
            .avecCodeInsee(codeInsee)
            .avecMétéo('ORAGE')
            .build(),
        ];

        const commentaires = [
          new CommentaireRowBuilder()
            .avecChantierId(chantierId)
            .avecDate(new Date('2023-01-01'))
            .avecMaille(CODES_MAILLES[maille])
            .avecCodeInsee(codeInsee)
            .build(),
        ];

        const synthèses = [
          new SyntheseDesResultatsRowBuilder()
            .avecChantierId(chantierId)
            .avecMaille(CODES_MAILLES[maille])
            .avecCodeInsee(codeInsee)
            .avecDateCommentaire(new Date('2023-01-01'))
            .avecDateMétéo(new Date('2023-01-01'))
            .build(),
        ];

        const indicateurs = [
          new IndicateurRowBuilder()
            .avecChantierId(chantierId)
            .avecMaille(CODES_MAILLES[maille])
            .avecCodeInsee(codeInsee)
            .avecDateValeurActuelle(new Date('2023-01-01'))
            .avecTerritoireCode(territoireCode)
            .build(),
        ];

        await Promise.all([
          prisma.chantier.createMany({ data: chantiers }),
          prisma.commentaire.createMany({ data: commentaires }),
          prisma.synthese_des_resultats.createMany({ data: synthèses }),
          prisma.indicateur.createMany({ data: indicateurs }),
        ]);

        // When
        const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], chantierIdsHabilités, territoireCodesHabilités);

        // Then
        expect(result).toStrictEqual({});
      });
    });

    test('renvoie uniquement les chantiers et les territoires accessibles en lecture', async () => {
      // Given
      const chantierId1 = 'CH-001';
      const chantierId2 = 'CH-002';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId1)
          .avecMaille(CODES_MAILLES['régionale'])
          .avecCodeInsee('01')
          .build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId2)
          .avecMaille(CODES_MAILLES['régionale'])
          .avecCodeInsee('01')
          .build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId2)
          .avecMaille('REG')
          .avecCodeInsee('02')
          .build(),
      ];

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId1)
          .avecMaille('REG')
          .avecCodeInsee('01')
          .avecDateCommentaire(new Date('2023-01-02'))
          .avecDateMétéo(new Date('2023-01-02'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId2)
          .avecMaille('REG')
          .avecCodeInsee('01')
          .avecDateCommentaire(new Date('2023-03-02'))
          .avecDateMétéo(new Date('2023-03-02'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId2)
          .avecMaille('REG')
          .avecCodeInsee('02')
          .avecDateCommentaire(new Date('2023-01-02'))
          .avecDateMétéo(new Date('2023-01-02'))
          .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId1)
          .avecMaille('REG')
          .avecCodeInsee('01')
          .avecDateValeurActuelle(new Date('2023-02-02'))
          .avecTerritoireCode('REG-01')
          .build(),
        new IndicateurRowBuilder()
          .avecChantierId(chantierId2)
          .avecMaille('REG')
          .avecCodeInsee('01')
          .avecDateValeurActuelle(new Date('2023-03-02'))
          .avecTerritoireCode('REG-01')
          .build(),
        new IndicateurRowBuilder()
          .avecChantierId(chantierId2)
          .avecMaille('REG')
          .avecCodeInsee('02')
          .avecDateValeurActuelle(new Date('2023-04-02'))
          .avecTerritoireCode('REG-01')
          .build(),
      ];

      const chantierIdsHabilités = [chantierId2];
      const territoireCodesHabilités = ['REG-01'];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId1, chantierId2], ['REG-01', 'REG-02'], chantierIdsHabilités, territoireCodesHabilités);

      // Then
      expect(result).toStrictEqual({
        [chantierIdsHabilités[0]]: {
          [territoireCodesHabilités[0]]: {
            dateDeMàjDonnéesQualitatives: new Date('2023-03-02'),
            dateDeMàjDonnéesQuantitatives: new Date('2023-03-02'),
          },
        },
      });
    });

    test.each([
      'commentaire', 'synthèseCommentaire', 'synthèseMétéo',
    ])('avec au max: %s', async (entité) => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const dateAncienne = new Date('2023-01-01');
      const dateRécente = new Date('2023-02-02');
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
        new ChantierSQLRowBuilder()
          .avecId('CH-000')
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];
      const commentaires = [
        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(entité === 'commentaire' ? dateRécente : dateAncienne)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(dateAncienne)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
      ];

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateCommentaire(entité === 'synthèseCommentaire' ? dateRécente : dateAncienne)
          .avecDateMétéo(entité === 'synthèseMétéo' ? dateRécente : dateAncienne)
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille('NAT')
          .avecCodeInsee('FR')
          .avecDateCommentaire(new Date('2028-06-10'))
          .avecDateMétéo(new Date('2028-06-10'))
          .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(dateAncienne)
          .avecTerritoireCode(territoireCode)
          .build(),
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(dateRécente)
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.commentaire.createMany({ data: commentaires }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], [chantierId], [territoireCode]);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02'));
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQuantitatives).toStrictEqual(new Date('2023-02-02'));

    });

    test("renvoie date données quantitatives null, quand il n'y a pas de date valeur actuelle d'indicateur", async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];
      const commentaires = [
        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-02-02'))
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
      ];

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateCommentaire(new Date('2023-01-01'))
          .avecDateMétéo(new Date('2023-01-01'))
          .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(null)
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      const chantierIdsHabilités = [chantierId, 'CH-000'];
      const territoireCodesHabilités = [territoireCode];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.commentaire.createMany({ data: commentaires }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], chantierIdsHabilités, territoireCodesHabilités);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQuantitatives).toBeNull();
    });

    test("renvoie date données qualitatives null, quand il n'y a pas de date pour une synthèse et pas de commentaire", async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];

      const synthèses = [new SyntheseDesResultatsRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecDateCommentaire(null)
        .avecDateMétéo(null)
        .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2023-02-02'))
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], [chantierId], [territoireCode]);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toBeNull();
    });

    test("renvoie date données qualitatives, même quand il n'y a pas de date pour une synthèse mais qu'il existe un commentaire daté", async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];

      const commentaires: commentaire[] = [
        new CommentaireRowBuilder()
          .avecChantierId(chantierId)
          .avecDate(new Date('2023-02-02'))
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
      ];

      const synthèses = [new SyntheseDesResultatsRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecDateCommentaire(null)
        .avecDateMétéo(null)
        .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2023-02-02'))
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.commentaire.createMany({ data: commentaires }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], [chantierId], [territoireCode]);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02'));
    });

    test('renvoie date données qualitatives, quand il y a une date pour synthèseCommentaire mais pas de date pour synthèseMétéo', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecMétéo('ORAGE')
          .build(),
      ];

      const synthèses = [new SyntheseDesResultatsRowBuilder()
        .avecChantierId(chantierId)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecDateCommentaire(new Date('2023-02-02'))
        .avecDateMétéo(null)
        .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2023-03-02'))
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode], [chantierId], [territoireCode]);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02'));
    });

    test('renvoie date données qualitatives null, quand il n\'y a pas de synthèse et pas de commentaire', async () => {
      // Given
      const chantierId1 = 'CH-001';
      const chantierId2 = 'CH-002';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierRepository = new ChantierSQLRepository(prisma);

      const chantiers: chantier[] = [
        new ChantierSQLRowBuilder()
          .avecId(chantierId1)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
        new ChantierSQLRowBuilder()
          .avecId(chantierId2)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .build(),
      ];

      const synthèses = [new SyntheseDesResultatsRowBuilder()
        .avecChantierId(chantierId1)
        .avecMaille(CODES_MAILLES[maille])
        .avecCodeInsee(codeInsee)
        .avecDateCommentaire(new Date('2023-01-02'))
        .avecDateMétéo(new Date('2023-01-02'))
        .build(),
      ];

      const indicateurs = [
        new IndicateurRowBuilder()
          .avecChantierId(chantierId1)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2023-02-02'))
          .avecTerritoireCode(territoireCode)
          .build(),
        new IndicateurRowBuilder()
          .avecChantierId(chantierId2)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2023-03-02'))
          .avecTerritoireCode(territoireCode)
          .build(),
      ];

      const chantierIdsHabilités = [chantierId1, chantierId2];
      const territoireCodesHabilités = [territoireCode];

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId1, chantierId2], [territoireCode], chantierIdsHabilités, territoireCodesHabilités);

      // Then
      expect(result).toStrictEqual({
        [chantierId1]: {
          [territoireCode]: {
            dateDeMàjDonnéesQualitatives: new Date('2023-01-02'),
            dateDeMàjDonnéesQuantitatives: new Date('2023-02-02'),
          },
        },
        [chantierId2]: {
          [territoireCode]: {
            dateDeMàjDonnéesQualitatives: null,
            dateDeMàjDonnéesQuantitatives: new Date('2023-03-02'),
          },
        },
      });
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
