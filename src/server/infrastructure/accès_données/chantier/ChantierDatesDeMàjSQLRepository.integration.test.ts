import { chantier, commentaire } from '@prisma/client';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';
import ChantierDatesDeMàjSQLRepository
  from '@/server/infrastructure/accès_données/chantier/ChantierDatesDeMàjSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import ChantierSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/ChantierSQLRow.builder';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import CommentaireRowBuilder from '@/server/infrastructure/test/builders/sqlRow/CommentaireSQLRow.builder';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import IndicateurRowBuilder from '@/server/infrastructure/test/builders/sqlRow/IndicateurSQLRow.builder';

describe('ChantierDatesDeMàjSQLRepository', () => {

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
        const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
            dateDeMàjDonnéesQualitatives: new Date('2023-03-02').toISOString(),
            dateDeMàjDonnéesQuantitatives: new Date('2023-03-02').toISOString(),
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
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
        new CommentaireRowBuilder()
          .avecChantierId('CH-000')
          .avecDate(new Date('2028-12-31')) // ne doit pas être pris
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
          .avecMaille('NAT') // ne doit pas être pris
          .avecCodeInsee('FR')
          .avecDateCommentaire(new Date('2028-06-10'))
          .avecDateMétéo(new Date('2028-06-10'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-000')
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateCommentaire(new Date('2028-12-31')) // ne doit pas être pris
          .avecDateMétéo(new Date('2028-12-31'))
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
        new IndicateurRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(dateRécente)
          .avecTerritoireCode(territoireCode)
          .build(),
        new IndicateurRowBuilder()
          .avecChantierId('CH-000') // ne doit pas être pris
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecDateValeurActuelle(new Date('2028-12-31'))
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
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02').toISOString());
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQuantitatives).toStrictEqual(new Date('2023-02-02').toISOString());

    });

    test("renvoie date données quantitatives null, quand il n'y a pas de date valeur actuelle d'indicateur", async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02').toISOString());
    });

    test('renvoie date données qualitatives, quand il y a une date pour synthèseCommentaire mais pas de date pour synthèseMétéo', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02').toISOString());
    });

    test('renvoie date données qualitatives null, quand il n\'y a pas de synthèse et pas de commentaire', async () => {
      // Given
      const chantierId1 = 'CH-001';
      const chantierId2 = 'CH-002';
      const maille = 'régionale';
      const codeInsee = '01';
      const territoireCode = 'REG-01';
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

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
            dateDeMàjDonnéesQualitatives: new Date('2023-01-02').toISOString(),
            dateDeMàjDonnéesQuantitatives: new Date('2023-02-02').toISOString(),
          },
        },
        [chantierId2]: {
          [territoireCode]: {
            dateDeMàjDonnéesQualitatives: null,
            dateDeMàjDonnéesQuantitatives: new Date('2023-03-02').toISOString(),
          },
        },
      });
    });

  });

});
