import { createMocks } from 'node-mocks-http';
import handlePostCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import PosterUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/PosterUnNouveauCommentaireUseCase';

describe('/api/chantier/:chantierId/commentaire', () => {
  it('renvoyer une erreur si un des champs n\'est pas bien renseigné', () => {
    // Given
    const { req, res } = createMocks({
      method: 'POST',
      query: { toto: 'CH-001' },
      body: {
        typeCommentaire: 'freinsÀLever',
        maille: 'nationale',
        codeInsee: 'FR',
        détailsCommentaire: {
          contenu: 'Mon commentaire',
          date: '23/03/2023',
          auteur: 'ditp',
        },
      },
    });
    const stubPosterUnNouveauCommentaireUseCase = <PosterUnNouveauCommentaireUseCase>{};
    stubPosterUnNouveauCommentaireUseCase.run = () => Promise.resolve();

    // When
    handlePostCommentaire(req, res, stubPosterUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
  });

  it('renvoyer une erreur si la méthode n\'est pas POST', () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001' },
      body: {
        typeCommentaire: 'freinsÀLever',
        maille: 'nationale',
        codeInsee: 'FR',
        détailsCommentaire: {
          contenu: 'Mon commentaire',
          date: '23/03/2023',
          auteur: 'ditp',
        },
      },
    });
    const stubPosterUnNouveauCommentaireUseCase = <PosterUnNouveauCommentaireUseCase>{};
    stubPosterUnNouveauCommentaireUseCase.run = () => Promise.resolve();

    // When
    handlePostCommentaire(req, res, stubPosterUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(405);
  });
});
