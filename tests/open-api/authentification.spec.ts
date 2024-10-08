import { APIRequestContext, APIResponse, expect, test } from '@playwright/test';
import { configuration } from '@/config';

let apiContext: APIRequestContext;
let result: APIResponse;

test.describe('Authentification', () => {
  test('quand on ne dispose pas d\'un header Authorization, doit remonter une erreur 401 Unauthorized', async ({ playwright }) => {
    await test.step('Création du context sans header Authorization', async () => {
      apiContext = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
      });
    });

    await test.step('Appel du endpoint /api/open-api/healthcheck', async () => {
      result = await apiContext.get('/api/open-api/healthcheck');
    });

    await test.step('Vérification status égal 401', async () => {
      expect(result.status()).toEqual(401);
    });

    await apiContext.dispose();
  });

  test('quand on dispose d\'un header Authorization invalide, doit remonter une erreur 401 Unauthorized', async ({ playwright }) => {
    await test.step('Création du context avec header Authorization + valeur incorrect', async () => {
      apiContext = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'Authorization': 'invalid',
        },
      });
    });

    await test.step('Appel du endpoint /api/open-api/healthcheck', async () => {
      result = await apiContext.get('/api/open-api/healthcheck');
    });

    await test.step('Vérification status égal 401', async () => {
      expect(result.status()).toEqual(401);
    });

    await apiContext.dispose();
  });

  test('quand on dispose d\'un header Authorization valide mais que le token n\'a pas été forgé par notre API, doit remonter une erreur 401 Unauthorized', async ({ playwright }) => {
    await test.step('Création du context avec header Authorization et valeur Bearer + JWT non pilote', async () => {
      apiContext = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      });
    });

    await test.step('Appel du endpoint /api/open-api/healthcheck', async () => {
      result = await apiContext.get('/api/open-api/healthcheck');
    });

    await test.step('Vérification status égal 401', async () => {
      expect(result.status()).toEqual(401);
    });

    await apiContext.dispose();
  });

  test('quand on dispose d\'un header Authorization valide et que le token a été forgé par notre API, doit remonter une réponse 200 OK', async ({ playwright }) => {
    const tokenAPIJohan = configuration.tokenAPI.localTokenAPIE2EJohan;

    await test.step('Création du context avec header Authorization et valeur Bearer + JWT pilote', async () => {
      apiContext = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'Authorization': `Bearer ${tokenAPIJohan}`,
        },
      });
    });

    await test.step('Appel du endpoint /api/open-api/healthcheck', async () => {
      result = await apiContext.get('/api/open-api/healthcheck');
    });

    await test.step("Vérification status égal 200 et que l'utilisateur appelant est bien 'johan.boucaut@modernisation.gouv.fr'", async () => {
      expect(result.status()).toEqual(200);
      expect(await result.json()).toEqual({
        resultat: "Bonjour johan.boucaut@modernisation.gouv.fr, vous pouvez utiliser l'API.",
      });
    });

    await apiContext.dispose();
  });
});
