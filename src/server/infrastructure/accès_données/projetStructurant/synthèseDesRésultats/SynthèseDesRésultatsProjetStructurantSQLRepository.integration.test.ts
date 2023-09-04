import { faker } from '@faker-js/faker';
import { synthese_des_resultats_projet_structurant } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SynthèseDesRésultatsProjetStructurantBuilder from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultats.builder';
import SynthèseDesRésultatsProjetStructurantSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsProjetStructurantSQLRow.builder';
import SynthèseDesRésultatsProjetStructurantRepository from '@/server/domain/projetStructurant/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { SynthèseDesRésultatsProjetStructurantSQLRepository } from './SynthèseDesRésultatsProjetStructurantSQLRepository';


describe('SynthèseDesRésultatsSQLRepository ', function () {
  describe('créer', () => {
    test('Crée la synthèse des résultats en base', async () => {
      // Given
      const projetStructurantId = faker.datatype.uuid();
      const id = faker.datatype.uuid();
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const météo = 'SOLEIL';

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);

      // When
      await synthèseDesRésultatsRepository.créer(projetStructurantId, id, contenu, auteur, météo, date);

      // Then
      const synthèseDesRésultatsCrééeEnBase = await prisma.synthese_des_resultats_projet_structurant.findUnique({ where: { id: id } });
      expect(synthèseDesRésultatsCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne la synthèse de résultats créée', async () => {
      // Given
      const projetStructurantId = faker.datatype.uuid();

      const { id, contenu, auteur, météo, date } = new SynthèseDesRésultatsProjetStructurantBuilder()
        .avecSynthèseDesRésultats({
          id: faker.datatype.uuid(),
          contenu: 'Quatrième commentaire',
          date: '2023-12-31T00:00:00.000Z',
          auteur: 'Jean DUPONT',
          météo: 'SOLEIL',
        })
        .build()!;

      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);

      // When
      const synthèseDesRésultatsCréée = await synthèseDesRésultatsRepository.créer(projetStructurantId, id, contenu, auteur, météo, new Date(date));

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

  describe('findNewestByProjetStructurantIdAndTerritoire', () => {
    test('Renvoie null si aucune synthèse des résultats n\'est présente en base', async () => {
      // Given
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente(faker.datatype.uuid());

      // Then
      expect(result).toBeNull();
    });

    test('renvoie la synthèse des résultats la plus récente et dont le commentaire est non nul', async () => {
      // Given
      const projetStructurantId = '4136cd0b-d90b-4af7-b485-5d1ded8db252';
      const synthèseDesRésultatsRepository: SynthèseDesRésultatsProjetStructurantRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);


      const synthesesDesResultats: synthese_des_resultats_projet_structurant[] = [
        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire('Premier commentaire')
          .avecDateCommentaire(null)
          .build(),

        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire(null)
          .avecDateCommentaire(new Date('2023-01-01'))
          .build(),

        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire('Troisième commentaire')
          .avecDateCommentaire(new Date('2023-01-01'))
          .build(),

        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecId('aaa-aaa')
          .avecMétéo('SOLEIL')
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire('Quatrième commentaire')
          .avecAuteur('Jean DUPONT')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats_projet_structurant.createMany({ data: synthesesDesResultats });

      // When
      const result = await synthèseDesRésultatsRepository.récupérerLaPlusRécente(projetStructurantId);

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
    test('Retourne, par ordre antéchronologique, toutes les synthèses des résultats pour un projet structurant', async () => {
      // GIVEN
      const synthèseDesRésultatsRepository = new SynthèseDesRésultatsProjetStructurantSQLRepository(prisma);
      const projetStructurantId = faker.datatype.uuid();

      const synthèsesDesResultats: synthese_des_resultats_projet_structurant[] = [
        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecId('aaaa-aab')
          .avecMétéo('SOLEIL')
          .avecAuteur('Jean DUPONT')
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire('Ma synthèse REG-01 2022')
          .avecDateCommentaire(new Date('2022-12-31'))
          .build(),

        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecId('aaaa-aaa')
          .avecMétéo('SOLEIL')
          .avecAuteur('Jean DUPONT')
          .avecProjetStructurantId(projetStructurantId)
          .avecCommentaire('Ma synthèse REG-01 2023')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),

        new SynthèseDesRésultatsProjetStructurantSQLRowBuilder()
          .avecProjetStructurantId(faker.datatype.uuid())
          .avecCommentaire('Ma synthèse DEPT-88')
          .avecDateCommentaire(new Date('2023-12-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats_projet_structurant.createMany({ data: synthèsesDesResultats });

      // WHEN
      const résultat = await synthèseDesRésultatsRepository.récupérerHistorique(projetStructurantId);

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
