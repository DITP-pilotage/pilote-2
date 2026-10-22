import { expect, Page } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { readMetadataIndicateur } from "./e2e-test-context";
import {
  CHANTIER_FOR_WRITES,
  INDICATEUR_FOR_OPEN_API,
} from "./seed/dedicated-entities";

// Chaque réponse renouvelle le cookie csrf que le formulaire lit au rendu :
// on attend la fin du chargement de la page avant d'enregistrer.
async function openChantierSettings(page: Page): Promise<void> {
  const listsLoaded = page.waitForResponse(
    /parametrageChantier\.listZonegroups/,
  );
  await page.goto(`/panel-administrateur/chantiers/${CHANTIER_FOR_WRITES}`);
  await listsLoaded;
}

// Une saisie ou un clic avant l'hydratation est perdu (WebKit) : on rejoue la sauvegarde,
// idempotente, jusqu'à la voir en base.
async function saveUntilPersisted(
  save: () => Promise<void>,
  readPersisted: () => Promise<unknown>,
  expected: unknown,
): Promise<void> {
  await expect(async () => {
    await save();
    await expect.poll(readPersisted, { timeout: 3_000 }).toEqual(expected);
  }).toPass();
}

test.describe("Paramétrage d'un chantier par l'administrateur DITP", () => {
  test("les métadonnées enregistrées sont relues après rechargement", async ({
    page,
    e2eContext,
  }) => {
    e2eContext.track(
      "CHANTIER_PARAMETRAGE_UPDATED",
      await prisma.metadata_chantiers.findUniqueOrThrow({
        where: { chantier_id: CHANTIER_FOR_WRITES },
      }),
    );
    await new AppActions(page, e2eContext).loginAs("ditp.admin@example.com");
    await openChantierSettings(page);

    await saveUntilPersisted(
      async () => {
        await page
          .getByRole("textbox", { name: "Description" })
          .fill("Description modifiée par un test e2e");
        await page.getByRole("button", { name: "Sauvegarder" }).first().click();
      },
      () =>
        prisma.metadata_chantiers.findUniqueOrThrow({
          where: { chantier_id: CHANTIER_FOR_WRITES },
          select: { ch_descr: true },
        }),
      { ch_descr: "Description modifiée par un test e2e" },
    );
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
      "INDICATEUR_UPDATED",
      await readMetadataIndicateur(INDICATEUR_FOR_OPEN_API),
    );
    await new AppActions(page, e2eContext).loginAs("ditp.admin@example.com");
    await openChantierSettings(page);
    await page.getByRole("tab", { name: "Pondérations" }).click();

    const nationalPonderationInput = page
      .getByRole("row")
      .filter({ hasText: INDICATEUR_FOR_OPEN_API })
      .getByRole("spinbutton")
      .first();
    await saveUntilPersisted(
      async () => {
        await nationalPonderationInput.fill("100");
        await page.getByRole("button", { name: "Enregistrer" }).first().click();
      },
      () =>
        prisma.metadata_parametrage_indicateurs.findUniqueOrThrow({
          where: { indic_id: INDICATEUR_FOR_OPEN_API },
          select: { poids_pourcent_nat_declaree: true },
        }),
      { poids_pourcent_nat_declaree: 100 },
    );
    await page.reload();
    await page.getByRole("tab", { name: "Pondérations" }).click();
    await expect(nationalPonderationInput).toHaveValue("100");
  });
});
