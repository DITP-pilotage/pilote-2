import { APIRequestContext, APIResponse, expect, test } from "@playwright/test";
import {
  ImportCommentaireAPIResponse,
  ImportCommentaireErrorResponse,
  ImportCommentaireSuccessResponse,
} from "@/server/import-commentaire/app/contrats/ImportCommentaireAPIContrat";
import {
  authentificationApiDirProjetFn,
  seedDatabase,
  suppressionAuthentificationApiFn,
} from "../utils";

let apiContext: APIRequestContext;
let result: APIResponse;

test.beforeAll(() => {
  seedDatabase();
});

test("Import de commentaires via l'API open-api", async ({
  playwright,
  page,
}) => {
  const { apiDirProjetToken, apiDirProjetChantierAssocie } =
    await authentificationApiDirProjetFn({ page });

  await test.step("Création du context - Authorization Pilote - equipe.dir.projet@example.com - EQUIPE_DIR_PROJET", async () => {
    apiContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${apiDirProjetToken}`,
        "Content-Type": "application/json",
      },
    });
  });

  await test.step("Import d'un commentaire valide sans date - doit retourner 200 OK", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "risques_et_freins_a_lever",
              contenu: "Contenu du commentaire de test e2e",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.success).toEqual(true);
    expect(responseBody.message).toEqual(
      "Les commentaires ont correctement été importés",
    );
  });

  await test.step("Import d'un commentaire avec une date antérieure - doit retourner 200 OK", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "solutions_et_actions_a_venir",
              contenu: "Commentaire avec date antérieure",
              date_commentaire: "2024-01-15",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.success).toEqual(true);
  });

  await test.step("Import de plusieurs commentaires valides - doit tous les créer", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "risques_et_freins_a_lever",
              contenu: "Premier commentaire",
            },
            {
              territoire: "NAT-FR",
              type: "solutions_et_actions_a_venir",
              contenu: "Deuxième commentaire",
            },
            {
              territoire: "NAT-FR",
              type: "exemples_concrets_de_reussite",
              contenu: "Troisième commentaire",
              date_commentaire: "2024-06-01",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.success).toEqual(true);
  });

  await test.step("Import avec une date dans le futur - doit retourner 400", async () => {
    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "risques_et_freins_a_lever",
              contenu: "Commentaire avec date future",
              date_commentaire: futurDateStr,
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.success).toEqual(false);
    expect(responseBody.erreurs).toBeDefined();
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import avec un type national sur une maille régionale - doit retourner 400", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "REG-84",
              type: "risques_et_freins_a_lever",
              contenu: "Type national sur maille régionale",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.success).toEqual(false);
    expect(responseBody.erreurs).toHaveLength(1);
    expect(responseBody.erreurs[0].message).toContain(
      "n'est pas autorisé pour la maille régionale",
    );
  });

  await test.step("Import avec un type régional sur une maille nationale - doit retourner 400", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "commentaires_sur_les_donnees",
              contenu: "Type régional sur maille nationale",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.success).toEqual(false);
    expect(responseBody.erreurs).toHaveLength(1);
    expect(responseBody.erreurs[0].message).toContain(
      "n'est pas autorisé pour la maille nationale",
    );
  });

  await test.step("Import avec un type invalide - doit retourner 400", async () => {
    result = await apiContext.post(
      `/api/open-api/chantier/${apiDirProjetChantierAssocie}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "type_inexistant",
              contenu: "Commentaire avec type invalide",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.success).toEqual(false);
    expect(responseBody.erreurs).toBeDefined();
  });

  await test.step("Import sur un chantier non autorisé - doit retourner 403", async () => {
    const chantierNonAutorise = "CH-999";

    result = await apiContext.post(
      `/api/open-api/chantier/${chantierNonAutorise}/commentaire`,
      {
        data: {
          commentaires: [
            {
              territoire: "NAT-FR",
              type: "risques_et_freins_a_lever",
              contenu: "Tentative sur chantier non autorisé",
            },
          ],
        },
      },
    );

    expect(result.status()).toEqual(403);

    const responseBody = (await result.json()) as ImportCommentaireAPIResponse;
    expect(responseBody.success).toEqual(false);
  });
});
