import { expect, test } from "@playwright/test";
import { seedDatabase } from "./utils";
import { AppActions } from "./actions/app.actions";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir consulter les données des chantiers", async ({ page }) => {
  const chantier = {
    id: "155",
    nom: "Faciliter l'efficacité opérationnelle",
  };

  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();

  await test.step("Vérification de la structure de la page d'accueil", async () => {
    await pageAccueil.expectStructure();
  });

  await test.step("Ajout du filtre ministère 'Transition écologique et Cohésion des territoires'", async () => {
    await pageAccueil.filterByMinistere(
      "Transition écologique et Cohésion des territoires",
    );
  });

  await test.step("Vérification filtre ministère actif 'Transition écologique et Cohésion des territoires'", async () => {
    await pageAccueil.expectFilterTag("Logement");
    await pageAccueil.expectFilterTag("Transition Écologique");
  });

  await test.step(`Navigation vers le chantier "${chantier.nom}"`, async () => {
    await expect(
      page.getByRole("table").getByRole("cell", { name: chantier.nom }),
    ).toBeVisible();

    const pageChantier = await pageAccueil.selectChantier(
      chantier.nom,
      chantier.id,
    );

    await test.step(`Vérification de la structure de la page chantier "${chantier.nom}"`, async () => {
      await pageChantier.expectTitle(chantier.id, chantier.nom);
      await pageChantier.expectStructure();
    });
  });
});
