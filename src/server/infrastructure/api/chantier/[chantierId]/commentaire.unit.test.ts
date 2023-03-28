import { createMocks, RequestOptions } from 'node-mocks-http';
import handleCréerCommentaire from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import CréerUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/CréerUnNouveauCommentaireUseCase';

describe('/api/chantier/:chantierId/commentaire', () => {
  const session = { user: { name: 'Utilisateur connecté' } };
  const getServerSession = jest.fn().mockResolvedValue(session);
  const stubCréerUnNouveauCommentaireUseCase = <CréerUnNouveauCommentaireUseCase>{};

  const csrfToken = 'toto';
  const requêteMockéeValide: RequestOptions = {
    method: 'POST',
    cookies: {
      'csrf': csrfToken,
    },
    query: { chantierId: 'CH-001' },
    body: {
      commentaireÀCréer: {
        typeCommentaire: 'freinsÀLever',
        codeInsee: 'FR',
        maille: 'nationale',
        contenu: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec convallis',
      },
      csrf: csrfToken,
    },
  };

  it("renvoi une erreur si un des champs de la requête n'est pas bien renseigné", async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      query: { toto: 'CH-001' },
    });

    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le parsing de la query a échoué.' });
  });

  it("renvoyer une erreur si la méthode http n'est pas POST", async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      method: 'GET',
    });
    
    // When
    await handleCréerCommentaire(req, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toStrictEqual({ error: "La méthode http n'est pas autorisée" });
  });

  it('renvoi une erreur si il manque un paramètre au commentaire', async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      body: {
        ...requêteMockéeValide.body,
        commentaireÀCréer: {
          typeCommentaire: 'autresRésultatsObtenus',
          codeInsee: 'FR',
          contenu: 'Mon commentaire',
        },
      },
    });

    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);

    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le commentaire est imcomplet' });
  });

  it('renvoi une erreur si le contenu du commentaire dépasse la limite de caractères', async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      body: {
        ...requêteMockéeValide.body,
        commentaireÀCréer: {
          ...requêteMockéeValide.body?.commentaireÀCréer,
          contenu: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec convallis, libero sed sollicitudin volutpat, magna massa euismod erat, ac bibendum purus justo at libero. Ut vestibulum velit dolor, et blandit libero mattis non. Aenean eget sollicitudin tellus. Nam tortor dolor, sollicitudin at nisi ut, maximus laoreet mi. Aliquam ut gravida erat, a efficitur ex. Donec eleifend accumsan erat, vitae convallis dolor porta a. Vivamus leo nulla, congue non metus vitae, maximus vulputate mi. Vivamus atq111',
        }, 
      },
    });


    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le contenu du commentaire dépasse la limite de caractères' });  
  });

  it("renvoi une erreur si le CSRF n'est pas valide", async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      cookies: {
        'csrf': 'hello',
      },
    });


    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: 'Le CSRF est invalide' });  
  });

  it('renvoi une erreur si le cookie CSRF est absent', async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
      cookies: {},
    });


    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toStrictEqual({ error: "Le cookie CSRF n'existe pas ou il n'est pas correctement soumis" });  
  });

  it("renvoi un statut 200 et le commentaire quand il n'y a pas d'erreur", async () => {
    // Given
    const { req, res } = createMocks(requêteMockéeValide);
    
    stubCréerUnNouveauCommentaireUseCase.run = () => Promise.resolve({ contenu: req.body.commentaireÀCréer.contenu, date: '01/01/2023', auteur: 'auteur' });

    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, getServerSession, stubCréerUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toStrictEqual({ contenu: req.body.commentaireÀCréer.contenu, date: '01/01/2023', auteur: 'auteur' });  
  });
});
