import { createMocks } from 'node-mocks-http';
import handlePublierCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import CréerUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/CréerUnNouveauCommentaireUseCase';

describe('/api/chantier/:chantierId/commentaire', () => {
  const session = { user: { name: 'Utilisateur connecté' } };
  const getServerSession = jest.fn().mockResolvedValue(session);

  it("renvoi une erreur si un des champs de la requête n'est pas bien renseigné", async () => {
    // Given
    const { req, res } = createMocks({
      method: 'POST',
      query: { toto: 'CH-001' },
      body: {
        typeCommentaire: 'actionsÀVenir',
        maille: 'nationale',
        codeInsee: 'FR',
        contenu: 'Contenu du commentaire',
      },
    });
    const stubPosterUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};

    // When
    await handlePublierCommentaire(req, res, getServerSession, stubPosterUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le parsing de la query a échoué.' });
  });

  it("renvoyer une erreur si la méthode http n'est pas POST", async () => {
    // Given
    const { req, res } = createMocks({
      method: 'GET',
      query: { chantierId: 'CH-001' },
      body: {
        typeCommentaire: 'actionsÀValoriser',
        maille: 'nationale',
        codeInsee: 'FR',
        contenu: 'Mon commentaire',
      },
    });
    const stubCréerUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};

    // When
    await handlePublierCommentaire(req, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toStrictEqual({ error: "La méthode http n'est pas autorisée" });
  });

  it('revoi une erreur si il manque un paramètre au commentaire', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'POST',
      query: { chantierId: 'CH-001' },
      body: {
        typeCommentaire: 'autresRésultatsObtenus',
        codeInsee: 'FR',
        contenu: 'Mon commentaire',
      },
    });

    const stubPosterUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};
  
    // When
    await handlePublierCommentaire(req, res, getServerSession, stubPosterUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le commentaire est imcomplet' });
  });

  it('renvoi une erreur si le contenu du commentaire dépasse la limite de caractères', async () => {
    // Given
    const { req, res } = createMocks({
      method: 'POST',
      query: { chantierId: 'CH-001' },
      body: {
        typeCommentaire: 'freinsÀLever',
        codeInsee: 'FR',
        maille: 'nationale',
        contenu: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec convallis, libero sed sollicitudin volutpat, magna massa euismod erat, ac bibendum purus justo at libero. Ut vestibulum velit dolor, et blandit libero mattis non. Aenean eget sollicitudin tellus. Nam tortor dolor, sollicitudin at nisi ut, maximus laoreet mi. Aliquam ut gravida erat, a efficitur ex. Donec eleifend accumsan erat, vitae convallis dolor porta a. Vivamus leo nulla, congue non metus vitae, maximus vulputate mi. Vivamus atq111',
      },
    });
    
    const stubPosterUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};

    // When
    await handlePublierCommentaire(req, res, getServerSession, stubPosterUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le contenu du commentaire dépasse la limite de caractères' });  
  });

  it("renvoi un statut 200 et le commentaire quand il n'y a pas d'erreur", async () => {
    // Given
    const { req, res } = createMocks({
      method: 'POST',
      query: { chantierId: 'CH-001' },
      body: {
        typeCommentaire: 'freinsÀLever',
        codeInsee: 'FR',
        maille: 'nationale',
        contenu: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec convallis',
      },
    });
    
    const stubPosterUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};
    stubPosterUnNouveauCommentaireUseCase.run = () => Promise.resolve({ contenu: req.body.contenu, date: '01/01/2023', auteur: 'auteur' });

    // When
    await handlePublierCommentaire(req, res, getServerSession, stubPosterUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({ contenu: req.body.contenu, date: '01/01/2023', auteur: 'auteur' });  
  });
});
