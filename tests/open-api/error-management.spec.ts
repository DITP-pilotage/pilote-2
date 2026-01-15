import { APIRequestContext, APIResponse, expect, test } from "@playwright/test";
import {
  authentificationApiDirProjetFn,
  suppressionAuthentificationApiFn,
} from "../utils";

let apiContext: APIRequestContext;
let result: APIResponse;

test.describe("Error - endpoint chantier", async () => {
  test("quand on a pas accès au chantier, doit remonter une erreur 403 ForbiddenError", async ({
    playwright,
    page,
  }) => {
    const { apiDirProjetToken, apiDirProjetUsername } =
      await authentificationApiDirProjetFn({ page });

    await test.step("Création du context - Authorization Pilote - cecile - EQUIPE_DIR_PROJET", async () => {
      apiContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL,
        extraHTTPHeaders: {
          Authorization: `Bearer ${apiDirProjetToken}`,
        },
      });
    });

    await test.step("Appel du endpoint /api/open-api/chantier/CH-039/donnees", async () => {
      result = await apiContext.get("/api/open-api/chantier/CH-039/donnees");
    });

    await test.step("Vérification status égal 403 Forbidden", async () => {
      expect(result.status()).toEqual(403);
    });

    await test.step('Vérification message égal "Vous n\'êtes pas autorisé à atteindre cette ressource"', async () => {
      expect(await result.json()).toEqual({
        message: "Vous n'êtes pas autorisé à accéder au chantier CH-039",
        success: false,
      });
    });

    await suppressionAuthentificationApiFn({
      page,
      apiUsername: apiDirProjetUsername,
    });
  });
});

test.describe("Error - endpoint indicateur", async () => {
  test("quand on a pas accès à l'indicateur, doit remonter une erreur 403 ForbiddenError", async ({
    playwright,
    page,
  }) => {
    const { apiDirProjetToken, apiDirProjetUsername } =
      await authentificationApiDirProjetFn({ page });

    await test.step("Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET", async () => {
      apiContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL,
        extraHTTPHeaders: {
          Authorization: `Bearer ${apiDirProjetToken}`,
        },
      });
    });

    await test.step("Appel du endpoint /api/open-api/chantier/CH-039/indicateur/IND-718/donnees", async () => {
      result = await apiContext.get(
        "/api/open-api/chantier/CH-039/indicateur/IND-718/donnees",
      );
    });

    await test.step("Vérification status égal 403 Forbidden", async () => {
      expect(result.status()).toEqual(403);
    });

    await test.step('Vérification message égal "Vous n\'êtes pas autorisé à atteindre cette ressource"', async () => {
      expect(await result.json()).toEqual({
        message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-718",
        success: false,
      });
    });

    await suppressionAuthentificationApiFn({
      page,
      apiUsername: apiDirProjetUsername,
    });
  });

  test("quand une erreur inattendue intervient, doit remonter une erreur 500 InternalServerError", async ({
    playwright,
    page,
  }) => {
    const { apiDirProjetToken, apiDirProjetUsername } =
      await authentificationApiDirProjetFn({ page });

    await test.step("Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET", async () => {
      apiContext = await playwright.request.newContext({
        baseURL: process.env.BASE_URL,
        extraHTTPHeaders: {
          Authorization: `Bearer ${apiDirProjetToken}`,
        },
      });
    });

    await test.step("Appel du endpoint /api/open-api/chantier/CH-039/indicateur/IND-718/donnees", async () => {
      result = await apiContext.get(
        "/api/open-api/chantier/CH-039/indicateur/IND-718/donnees",
      );
    });

    await test.step("Vérification status égal 403 Forbidden", async () => {
      expect(result.status()).toEqual(403);
    });

    await test.step('Vérification message égal "Vous n\'êtes pas autorisé à atteindre cette ressource"', async () => {
      expect(await result.json()).toEqual({
        message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-718",
        success: false,
      });
    });

    await suppressionAuthentificationApiFn({
      page,
      apiUsername: apiDirProjetUsername,
    });
  });
});
