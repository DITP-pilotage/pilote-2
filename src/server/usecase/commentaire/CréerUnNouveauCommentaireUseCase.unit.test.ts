import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import CréerUnNouveauCommentaireUseCase from './CréerUnNouveauCommentaireUseCase';

describe('CréerUnNouveauCommentaire', () => {
  describe('run', () => {
    it('Crée un commentaire avec les arguments donnés en paramètre', async () => {
      // Given
      const chantierId = 'CH-001';
      const typeCommentaire = 'freinsÀLever';
      const maille = 'nationale';
      const codeInsee = 'FR';
      const contenu =  'Commentaire';
      const date = '2023-03-21T00:00:00.000Z';
      const auteur = 'Louise Fabien';

      jest.useFakeTimers().setSystemTime(new Date(date));
      const stubCommentaireRepository = { créerNouveauCommentaire: jest.fn() } as unknown as CommentaireRepository;
      const posterUnNouveauCommentaire = new CréerUnNouveauCommentaireUseCase(stubCommentaireRepository);

      // When
      await posterUnNouveauCommentaire.run(chantierId, { typeCommentaire, maille, codeInsee, contenu }, auteur );

      // Then
      expect(stubCommentaireRepository.créerNouveauCommentaire).toHaveBeenNthCalledWith(1, chantierId, typeCommentaire, maille, codeInsee, { contenu, auteur, date });
    });
  });
});
