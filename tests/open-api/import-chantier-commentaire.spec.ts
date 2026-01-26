import { expect, test } from "@playwright/test";
import {
  ImportCommentaireErrorResponse,
  ImportCommentaireSuccessResponse,
} from "@/server/commentaires/app/contrats/ImportCommentaireAPIContrat";
import { ApiTestContext } from "./api-client/api-test-context";
import { CommentaireInput } from "./api-client/open-api.client";
import { seedDatabase } from "../utils";

test.beforeAll(() => {
  seedDatabase();
});

test("Import de commentaires via l'API open-api", async ({ playwright }) => {
  const apiContext = await ApiTestContext.create(
    playwright,
    "EQUIPE_DIR_PROJET",
  );
  const client = apiContext.getClient();
  const chantierId = apiContext.chantierId!;

  await test.step("Import d'un commentaire valide sans date - doit retourner 200 OK", async () => {
    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        type: "risques_et_freins_a_lever",
        contenu: "Contenu du commentaire de test e2e",
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.message).toEqual(
      "Les commentaires ont correctement été importés",
    );
  });

  await test.step("Import d'un commentaire avec une date antérieure - doit retourner 200 OK", async () => {
    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        type: "solutions_et_actions_a_venir",
        contenu: "Commentaire avec date antérieure",
        date_commentaire: "2024-01-15",
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import de plusieurs commentaires valides - doit tous les créer", async () => {
    const commentaires: CommentaireInput[] = [
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
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportCommentaireSuccessResponse;
    expect(responseBody.message).toBeDefined();
  });

  await test.step("Import avec une date dans le futur - doit retourner 400", async () => {
    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        type: "risques_et_freins_a_lever",
        contenu: "Commentaire avec date future",
        date_commentaire: futurDateStr,
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import avec un type national sur une maille régionale - doit retourner 400", async () => {
    const commentaires: CommentaireInput[] = [
      {
        territoire: "REG-84",
        type: "risques_et_freins_a_lever",
        contenu: "Type national sur maille régionale",
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.erreurs).toHaveLength(1);
    expect(responseBody.erreurs[0].message).toContain(
      "n'est pas autorisé pour la maille régionale",
    );
  });

  await test.step("Import avec un type régional sur une maille nationale - doit retourner 400", async () => {
    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        type: "commentaires_sur_les_donnees",
        contenu: "Type régional sur maille nationale",
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.erreurs).toHaveLength(1);
    expect(responseBody.erreurs[0].message).toContain(
      "n'est pas autorisé pour la maille nationale",
    );
  });

  await test.step("Import avec un type invalide - doit retourner 400", async () => {
    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        // @ts-ignore on test justement un type inexistant
        type: "type_inexistant",
        contenu: "Commentaire avec type invalide",
      },
    ];

    const result = await client.importCommentaires(chantierId, commentaires);

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportCommentaireErrorResponse;
    expect(responseBody.erreurs).toBeDefined();
  });

  await test.step("Import sur un chantier non autorisé - doit retourner 403", async () => {
    const chantierNonAutorise = "CH-999";
    const commentaires: CommentaireInput[] = [
      {
        territoire: "NAT-FR",
        type: "risques_et_freins_a_lever",
        contenu: "Tentative sur chantier non autorisé",
      },
    ];

    const result = await client.importCommentaires(
      chantierNonAutorise,
      commentaires,
    );

    expect(result.status()).toEqual(403);
  });

  await apiContext.dispose();
});
