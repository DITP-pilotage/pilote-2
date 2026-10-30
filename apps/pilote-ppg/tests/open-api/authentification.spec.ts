import { expect } from "@playwright/test";
import { test } from "../fixtures";

test.describe("Authentification", () => {
  test("quand on ne dispose pas d'un header Authorization, doit remonter une erreur 401 Unauthorized", async ({
    openApiUnauthenticated,
  }) => {
    const client = await openApiUnauthenticated({
      skip: true,
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(401);
  });

  test("quand on dispose d'un header Authorization invalide, doit remonter une erreur 400 Bad Request", async ({
    openApiUnauthenticated,
  }) => {
    const client = await openApiUnauthenticated({
      value: "invalid",
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(400);
  });

  test("quand on dispose d'un header Authorization valide mais que le token n'a pas été forgé par notre API, doit remonter une erreur 400 Request", async ({
    openApiUnauthenticated,
  }) => {
    const fakeJwt =
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    const client = await openApiUnauthenticated({
      value: fakeJwt,
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(400);
  });

  test.describe("quand on dispose d'un header Authorization valide et que le token a été forgé par notre API", () => {
    test("doit remonter une réponse 200 OK", async ({ openApi }) => {
      const apiContext = await openApi("DITP_ADMIN");
      const client = apiContext.getClient();

      const result = await client.healthcheck();

      expect(result.status()).toEqual(200);
      expect(await result.json()).toEqual({
        resultat: `Bonjour ${apiContext.userEmail}, vous pouvez utiliser l'API.`,
      });
    });
  });
});
