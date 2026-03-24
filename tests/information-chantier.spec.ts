import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageChantier } from "./pages/page-chantier";

test.describe("Consultation des données d'un chantier — Isolation par profil", () => {
  const chantierId = "129";

  test("DITP Admin — Accès complet en lecture et écriture", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("ditp.admin@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "NAT-FR");

    await step("Vérification de la structure nationale complète", async () => {
      await pageChantier.expectStructureNationale();
    });

    await step("Vérification du sélecteur de maille visible", async () => {
      await pageChantier.expectMailleSelectorVisible();
    });

    await step(
      "Vérification du lien 'Mettre à jour les données' visible",
      async () => {
        await pageChantier.expectImportLinkVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire visibles",
      async () => {
        await pageChantier.expectCommentWriteButtonsVisible(
          PageChantier.COMMENT_TYPES_NATIONAL,
        );
      },
    );
  });

  test("Premier Ministre — Lecture seule, tous territoires", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("premiere.ministre@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "NAT-FR");

    await step("Vérification de la structure nationale complète", async () => {
      await pageChantier.expectStructureNationale();
    });

    await step("Vérification du sélecteur de maille visible", async () => {
      await pageChantier.expectMailleSelectorVisible();
    });

    await step(
      "Vérification du lien 'Mettre à jour les données' non visible",
      async () => {
        await pageChantier.expectImportLinkNotVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire non visibles",
      async () => {
        await pageChantier.expectCommentWriteButtonsNotVisible(
          PageChantier.COMMENT_TYPES_NATIONAL,
        );
      },
    );
  });

  test("Équipe Direction de Projet — Périmètre chantier limité, écriture nationale", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("equipe.dir.projet@example.com");

    const pageChantier = new PageChantier(page, e2eContext);

    await step("Navigation vers un chantier autorisé (CH-129)", async () => {
      await pageChantier.selectChantierAvecTerritoire(chantierId, "NAT-FR");
    });

    await step("Vérification de la structure nationale complète", async () => {
      await pageChantier.expectStructureNationale();
    });

    await step("Vérification du sélecteur de maille visible", async () => {
      await pageChantier.expectMailleSelectorVisible();
    });

    await step(
      "Vérification du lien 'Mettre à jour les données' visible",
      async () => {
        await pageChantier.expectImportLinkVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire visibles",
      async () => {
        await pageChantier.expectCommentWriteButtonsVisible(
          PageChantier.COMMENT_TYPES_NATIONAL,
        );
      },
    );

    await step(
      "Navigation vers un chantier non autorisé — page 404",
      async () => {
        await page.goto("/chantier/CH-001/NAT-FR");
        await pageChantier.expectPageNotFound();
      },
    );
  });

  test("Coordinateur Département — Territoire restreint, sélecteur de maille masqué", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("pva.coordinateur.dept@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "DEPT-56");

    await step(
      "Vérification de la structure territoriale (sans décisions stratégiques)",
      async () => {
        await pageChantier.expectStructureTerritoriale();
      },
    );

    await step(
      "Vérification que le sélecteur de maille n'est PAS visible",
      async () => {
        await pageChantier.expectMailleSelectorNotVisible();
      },
    );

    await step(
      "Vérification du lien 'Mettre à jour les données' non visible",
      async () => {
        await pageChantier.expectImportLinkNotVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire visibles (écriture ATE)",
      async () => {
        await pageChantier.expectCommentWriteButtonsVisible(
          PageChantier.COMMENT_TYPES_TERRITORIAL,
        );
      },
    );
  });

  test("Préfet Région — Territoire régional, écriture commentaires ATE", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("chantier.prefet.reg@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "REG-53");

    await step(
      "Vérification de la structure territoriale (sans décisions stratégiques)",
      async () => {
        await pageChantier.expectStructureTerritoriale();
      },
    );

    await step("Vérification du sélecteur de maille visible", async () => {
      await pageChantier.expectMailleSelectorVisible();
    });

    await step(
      "Vérification du lien 'Mettre à jour les données' non visible",
      async () => {
        await pageChantier.expectImportLinkNotVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire visibles (écriture ATE)",
      async () => {
        await pageChantier.expectCommentWriteButtonsVisible(
          PageChantier.COMMENT_TYPES_TERRITORIAL,
        );
      },
    );
  });

  test("Coordinateur Département sans habilitation chantier — pas de boutons d'écriture", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("coordinateur.departement@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "DEPT-56");

    await step("Vérification de la structure territoriale", async () => {
      await pageChantier.expectStructureTerritoriale();
    });

    await step(
      "Vérification que le sélecteur de maille n'est PAS visible",
      async () => {
        await pageChantier.expectMailleSelectorNotVisible();
      },
    );

    await step(
      "Vérification des boutons de nouveau commentaire non visibles (pas de saisieCommentaire sur CH-129)",
      async () => {
        await pageChantier.expectCommentWriteButtonsNotVisible(
          PageChantier.COMMENT_TYPES_TERRITORIAL,
        );
      },
    );
  });

  test("Préfet Région sans habilitation chantier — pas de boutons d'écriture", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("prefet.region@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "REG-53");

    await step("Vérification de la structure territoriale", async () => {
      await pageChantier.expectStructureTerritoriale();
    });

    await step("Vérification du sélecteur de maille visible", async () => {
      await pageChantier.expectMailleSelectorVisible();
    });

    await step(
      "Vérification des boutons de nouveau commentaire non visibles (pas de saisieCommentaire sur CH-129)",
      async () => {
        await pageChantier.expectCommentWriteButtonsNotVisible(
          PageChantier.COMMENT_TYPES_TERRITORIAL,
        );
      },
    );
  });
});

test.describe("Cartographie PVA — Comparaison territoriale", () => {
  const chantierId = "129";

  async function selectionnerCartePVA(page: import("@playwright/test").Page) {
    // Scoper dans la section "Comparaison territoriale et évolution"
    const sectionComparaison = page.locator("div.fr-card").filter({
      hasText: "Comparaison territoriale et évolution",
    });

    // Cliquer sur le sélecteur de type de carte (Radix Select trigger)
    await sectionComparaison.getByRole("combobox").first().click();

    // Sélectionner la carte PVA dans le dropdown (portail Radix)
    await page
      .getByRole("option", {
        name: "Carte des propositions des valeurs d'avancement",
      })
      .click();
  }

  test("Affichage du widget PVA avec les données de propositions", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("ditp.admin@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "NAT-FR");

    await step(
      "Sélection de la carte des propositions de valeur d'avancement",
      async () => {
        await selectionnerCartePVA(page);
      },
    );

    await step(
      "Vérification que le widget 'Comparaison territoriale et évolution' s'affiche",
      async () => {
        await expect(
          page.getByText("Comparaison territoriale et évolution", {
            exact: true,
          }),
        ).toBeVisible();
      },
    );

    await step(
      "Vérification du sous-titre 'Nombres de propositions de valeur d'avancement'",
      async () => {
        await expect(
          page.getByText("Nombres de propositions de valeur d'avancement", {
            exact: true,
          }),
        ).toBeVisible();
      },
    );

    await step(
      "Vérification que le territoire initial (France) affiche '3 propositions'",
      async () => {
        await expect(
          page.getByText("3 propositions", { exact: true }),
        ).toBeVisible();
      },
    );

    await step(
      "Vérification de la présence du lien '+ ajouter un territoire'",
      async () => {
        await expect(
          page.getByText("+ ajouter un territoire").last(),
        ).toBeVisible();
      },
    );
  });

  test("Ajout et suppression d'un territoire dans le widget PVA", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    await appActions.loginAs("ditp.admin@example.com");

    const pageChantier = new PageChantier(page, e2eContext);
    await pageChantier.selectChantierAvecTerritoire(chantierId, "NAT-FR");

    await step(
      "Sélection de la carte des propositions de valeur d'avancement",
      async () => {
        await selectionnerCartePVA(page);
        await expect(
          page.getByText("Nombres de propositions de valeur d'avancement", {
            exact: true,
          }),
        ).toBeVisible();
      },
    );

    await step("Ajout du territoire 'Paris' via le picker", async () => {
      await page.getByText("+ ajouter un territoire").last().click();
      await page.getByLabel("Rechercher").last().fill("Paris");
      await page.getByRole("option", { name: "Paris" }).click();
    });

    await step(
      "Vérification que 'Paris' apparaît avec '2 propositions'",
      async () => {
        await expect(
          page.getByText("2 propositions", { exact: true }),
        ).toBeVisible();
      },
    );

    await step("Ajout du territoire 'Morbihan'", async () => {
      await page.getByText("+ ajouter un territoire").last().click();
      await page.getByLabel("Rechercher").last().fill("Morbihan");
      await page.getByRole("option", { name: "Morbihan" }).click();
    });

    await step(
      "Vérification que 'Morbihan' affiche 'pas de proposition'",
      async () => {
        await expect(
          page.getByText("pas de proposition", { exact: true }),
        ).toBeVisible();
      },
    );

    await step("Suppression de 'Paris' (clic sur le bouton ✕)", async () => {
      await page
        .getByTitle(/Retirer.*Paris/)
        .last()
        .click();
    });

    await step(
      "Vérification que 'Paris' n'est plus affiché dans le widget PVA",
      async () => {
        await expect(
          page.getByText("2 propositions", { exact: true }),
        ).not.toBeVisible();
      },
    );
  });
});
