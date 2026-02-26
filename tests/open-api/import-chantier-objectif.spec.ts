import { expect, test } from "@playwright/test";
import {
  ImportObjectifErrorResponse,
  ImportObjectifSuccessResponse,
} from "@/server/objectifs/app/contrats/ImportObjectifAPIContrat";
import { ApiTestContext } from "./api-client/api-test-context";
import { ObjectifInput } from "./api-client/open-api.client";

test("Import d'objectifs via l'API open-api", async ({ playwright }) => {
  const apiContext = await ApiTestContext.create(
    playwright,
    "EQUIPE_DIR_PROJET",
  );
  const client = apiContext.getClient();
  const chantierId = apiContext.chantierId!;

  await test.step("Import d'un objectif valide sans date - doit retourner 200 OK", async () => {
    const objectifs: ObjectifInput[] = [
      {
        type: "notre_ambition",
        contenu: "Contenu de l'objectif de test e2e",
      },
    ];

    const result = await client.importObjectifs(chantierId, objectifs);

    expect(result.status()).toEqual(200);

    const responseBody = (await result.json()) as ImportObjectifSuccessResponse;
    expect(responseBody.message).toEqual(
      "Les objectifs ont correctement été importés",
    );
  });

  await test.step("Import d'un objectif avec une date antérieure - doit retourner 200 OK", async () => {
    const objectifs: ObjectifInput[] = [
      {
        type: "deja_fait",
        contenu: "Objectif avec date antérieure",
        date_objectif: "2024-01-15",
      },
    ];

    const result = await client.importObjectifs(chantierId, objectifs);

    expect(result.status()).toEqual(200);

    const responseBody = (await result.json()) as ImportObjectifSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import de plusieurs objectifs valides - doit tous les créer", async () => {
    const objectifs: ObjectifInput[] = [
      {
        type: "notre_ambition",
        contenu: "Premier objectif",
      },
      {
        type: "deja_fait",
        contenu: "Deuxième objectif",
      },
      {
        type: "a_faire",
        contenu: "Troisième objectif",
        date_objectif: "2024-06-01",
      },
    ];

    const result = await client.importObjectifs(chantierId, objectifs);

    expect(result.status()).toEqual(200);

    const responseBody = (await result.json()) as ImportObjectifSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import avec une date dans le futur - doit retourner 400", async () => {
    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    const objectifs: ObjectifInput[] = [
      {
        type: "notre_ambition",
        contenu: "Objectif avec date future",
        date_objectif: futurDateStr,
      },
    ];

    const result = await client.importObjectifs(chantierId, objectifs);

    expect(result.status()).toEqual(400);

    const responseBody = (await result.json()) as ImportObjectifErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import avec un type invalide - doit retourner 400", async () => {
    const objectifs: ObjectifInput[] = [
      {
        // @ts-ignore on test justement un type inexistant
        type: "type_inexistant",
        contenu: "Objectif avec type invalide",
      },
    ];

    const result = await client.importObjectifs(chantierId, objectifs);

    expect(result.status()).toEqual(400);

    const responseBody = (await result.json()) as ImportObjectifErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
  });

  await test.step("Import sur un chantier non autorisé - doit retourner 403", async () => {
    const chantierNonAutorise = "CH-999";
    const objectifs: ObjectifInput[] = [
      {
        type: "notre_ambition",
        contenu: "Tentative sur chantier non autorisé",
      },
    ];

    const result = await client.importObjectifs(chantierNonAutorise, objectifs);

    expect(result.status()).toEqual(403);
  });

  await apiContext.dispose();
});
