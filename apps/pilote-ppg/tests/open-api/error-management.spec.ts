import { expect } from "@playwright/test";
import { test } from "../fixtures";
import { CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET } from "../seed/entites-dediees";

test.describe("Error - endpoint chantier", () => {
  test("quand on a pas accès au chantier, doit remonter une erreur 403 ForbiddenError", async ({
    openApi,
  }) => {
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const result = await client.getChantierDonnees(
      CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET,
    );

    expect(result.status()).toEqual(403);
    expect(await result.json()).toEqual({
      message: `Vous n'êtes pas autorisé à accéder au chantier ${CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET}`,
      success: false,
    });
  });
});

test.describe("Error - endpoint indicateur", () => {
  test("quand on a pas accès à l'indicateur, doit remonter une erreur 403 ForbiddenError", async ({
    openApi,
  }) => {
    const client = (await openApi("EQUIPE_DIR_PROJET")).getClient();

    const result = await client.getIndicateurDonnees(
      CHANTIER_HORS_PERIMETRE_EQUIPE_DIR_PROJET,
      "IND-105",
    );

    expect(result.status()).toEqual(403);
    expect(await result.json()).toEqual({
      message: "Vous n'êtes pas autorisé à accéder à l'indicateur IND-105",
      success: false,
    });
  });
});
