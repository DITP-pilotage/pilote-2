import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";

test("doit pouvoir consulter les données des chantiers", async ({
  page,
  e2eContext,
}) => {
  test.setTimeout(150_000);

  const chantier = {
    id: "155",
    nom: "Faciliter l'efficacité opérationnelle",
  };

  const appActions = new AppActions(page, e2eContext);
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

    const pageChantier = await pageAccueil.selectChantier(chantier.nom);

    await test.step(`Vérification de la structure de la page chantier "${chantier.nom}"`, async () => {
      await pageChantier.expectTitle(chantier.id, chantier.nom);
      await pageChantier.expectStructure();
    });

    await test.step("Vérification de l'historique des commentaires pour NAT-FR", async () => {
      await pageChantier.expectHistoriqueCommentaire();
    });

    await test.step("Navigation vers un DEPT", async () => {
      await pageChantier.selectChantierAvecTerritoire(chantier.id, "REG-76");
    });

    await test.step("Vérification de l'historique des commentaires pour Occitanie", async () => {
      await pageChantier.expectHistoriqueCommentaire(
        "commentairesSurLesDonnées",
      );
    });
  });
});
