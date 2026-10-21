import { expect } from "@playwright/test";
import { test } from "../fixtures";
import {
  CHANTIER_E2E,
  CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET,
} from "../seed/entites-dediees";
import {
  ImportDecisionStrategiqueErrorResponse,
  ImportDecisionStrategiqueSuccessResponse,
} from "@/server/decisions-strategiques/app/contrats/ImportDecisionStrategiqueAPIContrat";
import { DecisionStrategiqueInput } from "./api-client/open-api.client";

test("Import de décisions stratégiques via l'API open-api", async ({
  openApi,
  e2eContext,
}) => {
  e2eContext.track("DECISION_STRATEGIQUE_CREEE", { chantier_id: CHANTIER_E2E });
  const apiContext = await openApi("EQUIPE_DIR_PROJET");
  const client = apiContext.getClient();
  const chantierId = CHANTIER_E2E;

  await test.step("Import d'une décision stratégique valide sans date - doit retourner 200 OK", async () => {
    const decisions: DecisionStrategiqueInput[] = [
      {
        type: "suivi_des_decisions",
        contenu: "Contenu de la décision stratégique de test e2e",
      },
    ];

    const result = await client.importDecisionsStrategiques(
      chantierId,
      decisions,
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportDecisionStrategiqueSuccessResponse;
    expect(responseBody.message).toEqual(
      "Les décisions stratégiques ont correctement été importées",
    );
  });

  await test.step("Import d'une décision stratégique avec une date antérieure - doit retourner 200 OK", async () => {
    const decisions: DecisionStrategiqueInput[] = [
      {
        type: "suivi_des_decisions",
        contenu: "Décision avec date antérieure",
        date_decision_strategique: "2024-01-15",
      },
    ];

    const result = await client.importDecisionsStrategiques(
      chantierId,
      decisions,
    );

    expect(result.status()).toEqual(200);

    const responseBody =
      (await result.json()) as ImportDecisionStrategiqueSuccessResponse;
    expect(responseBody.message).toEqual(
      "Les décisions stratégiques ont correctement été importées",
    );
  });

  await test.step("Import avec une date dans le futur - doit retourner 400", async () => {
    const futurDate = new Date();
    futurDate.setFullYear(futurDate.getFullYear() + 1);
    const futurDateStr = futurDate.toISOString().split("T")[0];

    const decisions: DecisionStrategiqueInput[] = [
      {
        type: "suivi_des_decisions",
        contenu: "Décision avec date future",
        date_decision_strategique: futurDateStr,
      },
    ];

    const result = await client.importDecisionsStrategiques(
      chantierId,
      decisions,
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportDecisionStrategiqueErrorResponse;
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import avec un type invalide - doit retourner 400", async () => {
    const decisions: DecisionStrategiqueInput[] = [
      {
        // @ts-ignore on test justement un type inexistant
        type: "type_inexistant",
        contenu: "Décision avec type invalide",
      },
    ];

    const result = await client.importDecisionsStrategiques(
      chantierId,
      decisions,
    );

    expect(result.status()).toEqual(400);

    const responseBody =
      (await result.json()) as ImportDecisionStrategiqueErrorResponse;
    expect(responseBody.erreurs.length).toBeGreaterThan(0);
  });

  await test.step("Import sur un chantier non autorisé - doit retourner 403", async () => {
    const chantierNonAutorise = CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET;
    const decisions: DecisionStrategiqueInput[] = [
      {
        type: "suivi_des_decisions",
        contenu: "Tentative sur chantier non autorisé",
      },
    ];

    const result = await client.importDecisionsStrategiques(
      chantierNonAutorise,
      decisions,
    );

    expect(result.status()).toEqual(403);
  });
});
