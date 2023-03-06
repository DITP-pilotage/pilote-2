import { synthese_des_resultats } from '@prisma/client';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/chantier/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/tools/rowBuilder/SyntheseDesResultatsRowBuilder';
import SynthèseDesRésultatsRepository from '@/server/domain/chantier/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('findNewestByChantierId', () => {
    test('Récupère le contenu du commentaire et sa date si le chantier est présent en base', async () => {
      const createdDate = '2022-07-05T00:00:00.000Z';

      const résultatAttendu = {
        commentaireSynthèse: {
          contenu: 'Le suivi de l’indicateur relatif à la protection Animale...',
          date: new Date(createdDate).toLocaleDateString('fr-FR'),
        },
      };

      await prisma.synthese_des_resultats.create({
        data: {
          id: '0',
          chantier_id: 'CH-001',
          commentaire: résultatAttendu.commentaireSynthèse.contenu,
          date_commentaire: createdDate,
          maille: 'NAT',
          code_insee: 'FR',
        },
      });

      const repository = new SynthèseDesRésultatsSQLRepository(prisma);
      const result = await repository.findNewestByChantierId('CH-001');
      expect(result).toStrictEqual(résultatAttendu);
    });
    test('Une ligne avec date de commentaire mais sans commentaire est sautée', async () => {
      const createdDate = '2022-07-05T00:00:00.000Z';

      const résultatAttendu = {
        commentaireSynthèse: {
          contenu: 'Le suivi de l’indicateur relatif à la protection Animale...',
          date: new Date(createdDate).toLocaleDateString('fr-FR'),
        },
      };

      await prisma.synthese_des_resultats.create({
        data: {
          id: '0',
          chantier_id: 'CH-001',
          date_commentaire: '2022-08-05T00:00:00.000Z',
          maille: 'NAT',
          code_insee: 'FR',
        },
      });

      await prisma.synthese_des_resultats.create({
        data: {
          id: '1',
          chantier_id: 'CH-001',
          date_commentaire: createdDate,
          commentaire: résultatAttendu.commentaireSynthèse.contenu,
          maille: 'NAT',
          code_insee: 'FR',
        },
      });

      const repository = new SynthèseDesRésultatsSQLRepository(prisma);
      const result = await repository.findNewestByChantierId('CH-001');
      expect(result).toStrictEqual(résultatAttendu);
    });
  });

  describe('findNewestByChantierIdAndTerritoire', () => {
    test('Renvoie un détail commentaire null si aucune synthèses des résultats n\'est présente en base', async () => {
      // Given
      const repository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      const result = await repository.findNewestByChantierIdAndTerritoire('CH-001', 'départementale', 'O1');

      // Then
      expect(result).toStrictEqual(null);
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
      const result = await synthèseDesRésultatsRepository.findNewestByChantierIdAndTerritoire(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual({
        contenu: 'Quatrième commentaire',
        date: '2023-12-31',
        auteur: '',
      });
    });
  });
});
