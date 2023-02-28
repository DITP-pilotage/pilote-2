import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import CommentaireSQLRepository from '@/server/infrastructure/chantier/CommentaireSQLRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { commentairesNull } from '@/server/domain/chantier/Commentaire.interface';

describe('CommentaireSQLRepository', () => {
  describe( 'getByChantierIdAndTerritoire', () => {
    test('Retourne une liste de commentaire vide quand pas de commentaire en base', async () => {
      // GIVEN
      const commentaireRepository: CommentaireRepository = new CommentaireSQLRepository(prisma);

      // WHEN
      const commentaires = await commentaireRepository.getByChantierIdAndTerritoire('CH-001', 'DEPT', '01');

      // THEN
      await expect(commentaires).toBe(commentairesNull);
    });
  });

});
