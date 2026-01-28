import { expect, test } from "@playwright/test";
import { ApiTestContext } from "./api-client/api-test-context";
import { seedDatabase } from "../utils";

test.beforeAll(() => {
  seedDatabase();
});

test.describe("Error - endpoint chantier", () => {
  test("quand on a pas accès au chantier, doit remonter une erreur 403 ForbiddenError", async ({
    playwright,
  }) => {
    const apiContext = await ApiTestContext.create(
      playwright,
      "EQUIPE_DIR_PROJET",
    );
    const client = apiContext.getClient();

    const result = await client.getChantierDonnees("CH-039");

    expect(result.status()).toEqual(403);
    expect(await result.json()).toEqual({
      message: "Vous n'êtes pas autorisé à accéder au chantier CH-039",
      success: false,
    });

    await apiContext.dispose();
  });
});

test.describe("Error - endpoint indicateur", () => {
  test("quand on a pas accès à l'indicateur, doit remonter une erreur 403 ForbiddenError", async ({
    playwright,
  }) => {
    const apiContext = await ApiTestContext.create(
      playwright,
      "EQUIPE_DIR_PROJET",
    );
    const client = apiContext.getClient();

    const result = await client.getIndicateurDonnees("CH-039", "IND-718");

    expect(result.status()).toEqual(403);
    expect(await result.json()).toEqual({
      message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-718",
      success: false,
    });

    await apiContext.dispose();
  });

  test("quand une erreur inattendue intervient, doit remonter une erreur 500 InternalServerError", async ({
    playwright,
  }) => {
    const apiContext = await ApiTestContext.create(
      playwright,
      "EQUIPE_DIR_PROJET",
    );
    const client = apiContext.getClient();

    const result = await client.getIndicateurDonnees("CH-039", "IND-718");

    expect(result.status()).toEqual(403);
    expect(await result.json()).toEqual({
      message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-718",
      success: false,
    });

    await apiContext.dispose();
  });
});
