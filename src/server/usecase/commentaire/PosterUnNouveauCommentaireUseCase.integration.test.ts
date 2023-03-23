import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CommentaireSQLRepository from '@/server/infrastructure/accès_données/commentaire/CommentaireSQLRepository';
import PosterUnNouveauCommentaireUseCase from './PosterUnNouveauCommentaireUseCase';

describe('PosterUnNouveauCommentaire', () => {
  describe('run', () => {
    it('Crée un commentaire avec les arguments donnés en paramètres', async () => {
      // Given
      const chantierId = 'CH-001';
      const typeCommentaire = 'freinsÀLever';
      const maille = 'nationale';
      const codeInsee = 'FR';
      const détailsCommentaire = {
        contenu: 'Commentaire',
        date: '01/01/2023',
        auteur: 'ditp',
      };
      const stubCommentaireRepository = jest.spyOn(CommentaireSQLRepository, 'postNouveauCommentaire', chantierId);
      stubCommentaireRepository.postNouveauCommentaire = () => {};
      const posterUnNouveauCommentaire = new PosterUnNouveauCommentaireUseCase(stubCommentaireRepository);

      // When
      await posterUnNouveauCommentaire.run(chantierId, { typeCommentaire: typeCommentaire, maille: maille, codeInsee: codeInsee, détailsCommentaire: détailsCommentaire });

      // Then
      expect(stubCommentaireRepository.postNouveauCommentaire).toBeCalledWith(chantierId, typeCommentaire, maille, codeInsee, détailsCommentaire);
    });
  });
});
