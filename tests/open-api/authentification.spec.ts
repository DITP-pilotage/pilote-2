import { expect, test } from "@playwright/test";
import { createUnauthenticatedClient } from "./api-client/unauthenticated-api.client";
import { ApiTestContext } from "./api-client/api-test-context";

test.describe("Authentification", () => {
  test("quand on ne dispose pas d'un header Authorization, doit remonter une erreur 401 Unauthorized", async ({
    playwright,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = await createUnauthenticatedClient(playwright as any, {
      skip: true,
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(401);

    await client.dispose();
  });

  test("quand on dispose d'un header Authorization invalide, doit remonter une erreur 400 Bad Request", async ({
    playwright,
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = await createUnauthenticatedClient(playwright as any, {
      value: "invalid",
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(400);

    await client.dispose();
  });

  test("quand on dispose d'un header Authorization valide mais que le token n'a pas été forgé par notre API, doit remonter une erreur 400 Request", async ({
    playwright,
  }) => {
    const fakeJwt =
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = await createUnauthenticatedClient(playwright as any, {
      value: fakeJwt,
    });

    const result = await client.healthcheck();

    expect(result.status()).toEqual(400);

    await client.dispose();
  });

  test.describe("quand on dispose d'un header Authorization valide et que le token a été forgé par notre API", () => {
    test("doit remonter une réponse 200 OK", async ({ playwright }) => {
      const apiContext = await ApiTestContext.create(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        playwright as any,
        "DITP_ADMIN",
      );
      const client = apiContext.getClient();

      const result = await client.healthcheck();

      expect(result.status()).toEqual(200);
      expect(await result.json()).toEqual({
        resultat: `Bonjour ${apiContext.userEmail}, vous pouvez utiliser l'API.`,
      });

      await apiContext.dispose();
    });
  });
});
