import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import CommentaireProjetStructurantSQLRepository from './CommentaireProjetStructurantSQLRepository';

describe('CommentaireSQLRepository', () => {
  describe('créer', () => {
    test('Crée le commentaire en base', async () => {
      // Given
      const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
      const id = '7a33ee55-b74c-4464-892b-b2b7fdc3bc58';
      const contenu = 'Quatrième commentaire';
      const date = new Date('2023-12-31T00:00:00.000Z');
      const auteur = 'Jean DUPONT';
      const type = 'partenariatsEtMoyensMobilisés';

      const commentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);

      // When
      await commentaireProjetStructurantRepository.créer(projetStructurantId, id, contenu, auteur, type, date);

      // Then
      const commentaireCrééeEnBase = await prisma.commentaire_projet_structurant.findUnique({ where: { id: id } });
      expect(commentaireCrééeEnBase?.id).toEqual(id);
    });

    test('Retourne le commentaire créé', async () => {
      // Given
      const projetStructurantId = 'c4ff3bc7-878a-4449-b1a2-cc56692ecd27';
      const id = '7a33ee55-b74c-4464-892b-b2b7fdc3bc58';
      const contenu = 'Quatrième commentaire';
      const date = '2023-12-31T00:00:00.000Z';
      const auteur = 'Jean DUPONT';
      const type = 'partenariatsEtMoyensMobilisés';

      const commentaireProjetStructurantRepository = new CommentaireProjetStructurantSQLRepository(prisma);

      // When
      const commentaireCréée = await commentaireProjetStructurantRepository.créer(projetStructurantId, id, contenu, auteur, type, new Date(date));

      // Then
      expect(commentaireCréée).toStrictEqual({
        contenu,
        auteur,
        date,
        id,
        type,
      });
    });
  });
});
