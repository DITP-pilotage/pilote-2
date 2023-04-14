import { synthese_des_resultats } from '@prisma/client';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/accès_données/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import SynthèseDesRésultatsSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import SynthèseDesRésultatsBuilder from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.builder';

describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('créer', () => {
    test('Crée la synthèse des résultats en base', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';
      const id = '123';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const météo = 'SOLEIL';

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      await synthèseDesRésultatsRepository.créer(chantierId, maille, codeInsee, id, contenu, auteur, météo, date);

      // Then
      const synthèseDesRésultatsCrééeEnBase = await prisma.synthese_des_resultats.findUnique({ where: { id: id } });
      expect(synthèseDesRésultatsCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne la synthèse de résultats créée', async () => {
      // Given
      const chantierId = 'CH-001';
      const maille = 'régionale';
      const codeInsee = '01';

      const { id, contenu, auteur, météo, date } = new SynthèseDesRésultatsBuilder()
        .avecSynthèseDesRésultats({
          id: '123',
          contenu: 'Quatrième commentaire',
          date: '2023-12-31T00:00:00.000Z',
          auteur: 'Jean DUPONT',
          météo: 'SOLEIL',
        })
        .build()!;

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsSQLRepository(prisma);

      // When
      const synthèseDesRésultatsCréée = await synthèseDesRésultatsRepository.créer(chantierId, maille, codeInsee, id, contenu, auteur, météo, new Date(date));

      // Then
      expect(synthèseDesRésultatsCréée).toStrictEqual({
        contenu,
        auteur,
        date,
        id,
        météo,
      });
    });
  });

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
          .avecId('aaa-aaa')
          .avecMétéo('SOLEIL')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Quatrième commentaire')
          .avecAuteur('Jean DUPONT')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthesesDesResultats });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId, maille, codeInsee);

      // Then
      expect(result).toStrictEqual({
        id: 'aaa-aaa',
        météo: 'SOLEIL',
        contenu: 'Quatrième commentaire',
        date: '2023-12-31T00:00:00.000Z',
        auteur: 'Jean DUPONT',
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
          .avecId('aaaa-aab')
          .avecMétéo('SOLEIL')
          .avecAuteur('Jean DUPONT')
          .avecChantierId(chantierId)
          .avecMaille(CODES_MAILLES[maille])
          .avecCodeInsee(codeInsee)
          .avecCommentaire('Ma synthèse REG-01 2022')
          .avecDateCommentaire(new Date('2022-12-31'))
          .build(),

        new SynthèseDesRésultatsSQLRowBuilder()
          .avecId('aaaa-aaa')
          .avecMétéo('SOLEIL')
          .avecAuteur('Jean DUPONT')
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
      const résultat = await synthèseDesRésultatsRepository.récupérerHistorique(chantierId, maille, codeInsee);

      // THEN
      expect(résultat).toStrictEqual([
        {
          id: 'aaaa-aaa',
          météo: 'SOLEIL',
          auteur: 'Jean DUPONT',
          contenu: 'Ma synthèse REG-01 2023',
          date: '2023-12-31T00:00:00.000Z',
        }, {
          id: 'aaaa-aab',
          météo: 'SOLEIL',
          auteur: 'Jean DUPONT',
          contenu: 'Ma synthèse REG-01 2022',
          date: '2022-12-31T00:00:00.000Z',
        },
      ]);
    });
  });
});
