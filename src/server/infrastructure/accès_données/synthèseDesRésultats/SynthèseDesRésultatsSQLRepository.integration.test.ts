/* eslint-disable sonarjs/no-duplicate-string */
import { synthese_des_resultats } from '@prisma/client';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/accès_données/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import SynthèseDesRésultatsSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('findNewestByChantierIdAndTerritoire', () => {
    test('Renvoie null si aucune synthèse des résultats n\'est présente en base', async () => {
      // Given
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire('CH-001', 'départementale', 'O1');

      // Then
      expect(result).toBeNull();
    });

    test('renvoie la synthèse des résultats la plus récente et dont le commentaire est non nul', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);


      const synthesesDesResultats: synthese_des_resultats[] = [
        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Premier commentaire')
          .avecDateCommentaire(null)
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire(null)
          .avecDateCommentaire(new Date('2023-01-01'))
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Troisième commentaire')
          .avecDateCommentaire(new Date('2023-01-01'))
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Quatrième commentaire')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthesesDesResultats });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual({
        contenu: 'Quatrième commentaire',
        date: '2023-12-31T00:00:00.000Z',
        auteur: '',
      });
    });
  });

  describe('récupérerHistoriqueDeLaSynthèseDesRésultats', () => {
    test('Retourne, par ordre antéchronologique, toutes les synthèses des résultats pour un chantier et un territoire', async () => {
      // GIVEN
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';

      const synthèsesDesResultats: synthese_des_resultats[] = [
        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Ma synthèse REG-01 2022')
          .avecDateCommentaire(new Date('2022-12-31'))
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Ma synthèse REG-01 2023')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecChantierId(chantierId)
          .avecMaille('départementale')
          .avecCodeInsee('88')
          .avecCommentaire('Ma synthèse DEPT-88')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthèsesDesResultats });

      // WHEN
      const résultat = await synthèseDesRésultatsRepository.récupérerHistoriqueDeLaSynthèseDesRésultats(chantierId, maille, codeInsee);

      // THEN
      expect(résultat).toStrictEqual([
        {
          auteur: '',
          contenu: 'Ma synthèse REG-01 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          auteur: '',
          contenu: 'Ma synthèse REG-01 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });
});
