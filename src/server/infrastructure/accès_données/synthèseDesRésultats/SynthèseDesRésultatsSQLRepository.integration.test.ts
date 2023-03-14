import { synthese_des_resultats } from '@prisma/client';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/accès_données/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/tools/rowBuilder/SyntheseDesResultatsRowBuilder';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('findNewestByChantierIdAndTerritoire', () => {
    test('Renvoie un détail commentaire null si aucune synthèses des résultats n\'est présente en base', async () => {
      // Given
      const repository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      const result = await repository.récupérerLaPlusRécenteParChantierIdEtTerritoire('CH-001', 'départementale', 'O1');

      // Then
      expect(result).toStrictEqual({ auteur: '', contenu: '', date: '' });
    });

    test('renvoie la synthèse des résultats la plus récente et dont le commentaire est non nul', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille: Maille = 'régionale';
      const codeInsee = '01';
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      const syntheseDesResultatsRowBuilder = new SyntheseDesResultatsRowBuilder();

      const synthesesDesResultats: synthese_des_resultats[] = [
        syntheseDesResultatsRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withCommentaire('Premier commentaire')
          .withDateCommentaire(null)
          .build(),

        syntheseDesResultatsRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withCommentaire(null)
          .withDateCommentaire('2023-01-01')
          .build(),

        syntheseDesResultatsRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withCommentaire('Troisième commentaire')
          .withDateCommentaire('2023-01-01')
          .build(),

        syntheseDesResultatsRowBuilder
          .withChantierId(chantierId)
          .withMaille(CODES_MAILLES[maille])
          .withCodeInsee(codeInsee)
          .withCommentaire('Quatrième commentaire')
          .withDateCommentaire('2023-12-31')
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
});
