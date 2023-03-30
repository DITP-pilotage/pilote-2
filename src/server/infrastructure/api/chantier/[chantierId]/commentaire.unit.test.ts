import { createMocks, RequestOptions } from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import handleCréerCommentaire, { CommentaireParamsError } from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import CréerUnNouveauCommentaireUseCase from '@/server/usecase/commentaire/CréerUnNouveauCommentaireUseCase';
import { LIMITE_CARACTÈRES_COMMENTAIRE } from '@/server/domain/commentaire/Commentaire.validator';

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
    stubCréerUnNouveauCommentaireUseCase.run = () => Promise.reject(new CommentaireParamsError('Le commentaire est imcomplet'));
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
          contenu: faker.lorem.word(LIMITE_CARACTÈRES_COMMENTAIRE + 1),
        }, 
      },
    });

    // When
    stubCréerUnNouveauCommentaireUseCase.run = () => Promise.reject(new CommentaireParamsError('Le contenu du commentaire dépasse la limite de caractères'));
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

  it("renvoi une erreur si l'utilisateur n'est pas connecté", async () => {
    // Given
    const { req, res } = createMocks({
      ...requêteMockéeValide,
    });

    // When
    await handleCréerCommentaire({ ...req, body: JSON.stringify(req.body) }, res, jest.fn().mockReturnValue({ session: null }), stubCréerUnNouveauCommentaireUseCase);
  
    // Then
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toStrictEqual({ error: 'Utilisateur non authentifié' });  
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
