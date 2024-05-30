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
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode]);

      // Then
      expect(result[chantierId][territoireCode].dateDeMàjDonnéesQualitatives).toStrictEqual(new Date('2023-02-02').toISOString());
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

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
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
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode]);

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

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
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
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode]);

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
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId], [territoireCode]);

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

      await Promise.all([
        prisma.chantier.createMany({ data: chantiers }),
        prisma.synthese_des_resultats.createMany({ data: synthèses }),
        prisma.indicateur.createMany({ data: indicateurs }),
      ]);

      // When
      const result = await repository.récupérerDatesDeMiseÀJour([chantierId1, chantierId2], [territoireCode]);

      // Then
      expect(result).toStrictEqual({
        [chantierId1]: {
          [territoireCode]: {
            dateDeMàjDonnéesQualitatives: new Date('2023-01-02').toISOString(),
          },
        },
        [chantierId2]: {
          [territoireCode]: {
            dateDeMàjDonnéesQualitatives: null,
          },
        },
      });
    });

  });

});
