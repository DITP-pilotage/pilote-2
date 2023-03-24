import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import PublierUnNouveauCommentaireUseCase from './PublierUnNouveauCommentaireUseCase';

describe('PosterUnNouveauCommentaire', () => {
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
      const stubCommentaireRepository = { postNouveauCommentaire: jest.fn() } as unknown as CommentaireRepository;
      const posterUnNouveauCommentaire = new PublierUnNouveauCommentaireUseCase(stubCommentaireRepository);

      // When
      await posterUnNouveauCommentaire.run(chantierId, { typeCommentaire: typeCommentaire, maille: maille, codeInsee: codeInsee, contenu: contenu }, auteur );

      // Then
      expect(stubCommentaireRepository.postNouveauCommentaire).toHaveBeenNthCalledWith(1, chantierId, typeCommentaire, maille, codeInsee, { contenu, auteur, date });
    });
  });
});
