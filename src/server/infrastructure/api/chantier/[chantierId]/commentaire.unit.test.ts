import { createMocks } from 'node-mocks-http';
import handlePublierCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import PublierUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/PublierUnNouveauCommentaireUseCase';

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
        contenu: 'Mon commentaire',
      },
    });
    const stubPosterUnNouveauCommentaireUseCase = <PublierUnNouveauCommentaireUseCase>{};
    stubPosterUnNouveauCommentaireUseCase.run = () => Promise.resolve({ contenu: req.body.contenu, date: '01/01/2023', auteur: 'auteur' });

    // When
    handlePublierCommentaire(req, res, stubPosterUnNouveauCommentaireUseCase);

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
        contenu: 'Mon commentaire',
      },
    });
    const stubPosterUnNouveauCommentaireUseCase = <PublierUnNouveauCommentaireUseCase>{};
    stubPosterUnNouveauCommentaireUseCase.run = () => Promise.resolve({ contenu: req.body.contenu, date: '01/01/2023', auteur: 'auteur' });

    // When
    handlePublierCommentaire(req, res, stubPosterUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(405);
  });
});
