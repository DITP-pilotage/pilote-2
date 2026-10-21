import { expect, Page } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { lireMetadataIndicateur } from "./e2e-test-context";
import { CHANTIER_E2E, INDICATEUR_OPEN_API } from "./seed/entites-dediees";

// Chaque réponse renouvelle le cookie csrf que le formulaire lit au rendu :
// on attend la fin du chargement de la page avant d'enregistrer.
async function ouvrirLeParametrage(page: Page): Promise<void> {
  const listesChargees = page.waitForResponse(
    /parametrageChantier\.listZonegroups/,
  );
  await page.goto(`/panel-administrateur/chantiers/${CHANTIER_E2E}`);
  await listesChargees;
}

test.describe("Paramétrage d'un chantier par l'administrateur DITP", () => {
  test("les métadonnées enregistrées sont relues après rechargement", async ({
    page,
    e2eContext,
  }) => {
    e2eContext.track(
      "CHANTIER_PARAMETRAGE_MODIFIE",
      await prisma.metadata_chantiers.findUniqueOrThrow({
        where: { chantier_id: CHANTIER_E2E },
      }),
    );
    await new AppActions(page, e2eContext).loginAs("ditp.admin@example.com");
    await ouvrirLeParametrage(page);

    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Description modifiée par un test e2e");
    await page.getByRole("button", { name: "Sauvegarder" }).first().click();

    await expect
      .poll(async () =>
        prisma.metadata_chantiers.findUniqueOrThrow({
          where: { chantier_id: CHANTIER_E2E },
          select: { ch_descr: true },
        }),
      )
      .toEqual({ ch_descr: "Description modifiée par un test e2e" });
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Description" }),
    ).toHaveValue("Description modifiée par un test e2e");
  });

  test("les pondérations enregistrées sont relues après rechargement", async ({
    page,
    e2eContext,
  }) => {
    e2eContext.track(
      "INDICATEUR_MODIFIE",
      await lireMetadataIndicateur(INDICATEUR_OPEN_API),
    );
    await new AppActions(page, e2eContext).loginAs("ditp.admin@example.com");
    await ouvrirLeParametrage(page);
    await page.getByRole("tab", { name: "Pondérations" }).click();

    const ponderationNationale = page
      .getByRole("row")
      .filter({ hasText: INDICATEUR_OPEN_API })
      .getByRole("spinbutton")
      .first();
    await ponderationNationale.fill("100");
    await page.getByRole("button", { name: "Enregistrer" }).first().click();

    await expect
      .poll(async () =>
        prisma.metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: INDICATEUR_OPEN_API },
          select: { poids_pourcent_nat_declaree: true },
        }),
      )
      .toEqual({ poids_pourcent_nat_declaree: 100 });
    await page.reload();
    await page.getByRole("tab", { name: "Pondérations" }).click();
    await expect(ponderationNationale).toHaveValue("100");
  });
});
