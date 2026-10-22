import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageAdminIndicateurs } from "./pages/admin/page-admin-indicateurs";

const DITP_ADMIN = "ditp.admin@example.com";
const COORDINATEUR_REGION = "coordinateur.region@example.com";
const EQUIPE_DIR_PROJET = "equipe.dir.projet@example.com";

test.describe("Listing des indicateurs — Admin", () => {
  test("doit afficher la page de gestion des indicateurs avec la structure attendue", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageIndicateurs = new PageAdminIndicateurs(page, e2eContext);

    await test.step("Connexion en tant que DITP Admin et accès à la page", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageIndicateurs.goto();
      await pageIndicateurs.expectPageTitle();
    });

    await test.step("Vérification de la structure du tableau", async () => {
      await pageIndicateurs.expectColumnVisible("Chantier associé");
      await pageIndicateurs.expectColumnVisible("Nom du chantier");
      await pageIndicateurs.expectColumnVisible("Identifiant indicateur");
      await pageIndicateurs.expectColumnVisible("Nom de l'indicateur");
      await pageIndicateurs.expectColumnVisible("Dernière modification");
      await pageIndicateurs.expectColumnVisible("Actif / Inactif");
    });

    await test.step("Vérification de la présence des éléments de la page", async () => {
      await pageIndicateurs.expectCreateIndicateurButtonVisible();
      await pageIndicateurs.expectExportButtonVisible();
      await pageIndicateurs.expectIndicateursCountGreaterThan(0);
    });

    const nombreInitial = await pageIndicateurs.getDisplayedIndicateursCount();

    await test.step("Vérification de la pagination", async () => {
      await pageIndicateurs.expectPaginationVisible();
      await pageIndicateurs.expectTableRowCount(20);
    });

    await test.step("Recherche d'un indicateur par texte", async () => {
      await pageIndicateurs.searchIndicateur("IND-021");
      await pageIndicateurs.expectIndicateurInTable("IND-021");
      await pageIndicateurs.expectPaginationNotVisible();
    });

    await test.step("Effacement de la recherche — retour à l'état initial", async () => {
      await pageIndicateurs.clearSearch();
      await pageIndicateurs.expectIndicateursCount(nombreInitial);
      await pageIndicateurs.expectPaginationVisible();
    });

    await test.step("Filtre par indicateurs territorialisés", async () => {
      await pageIndicateurs.filterByTerritorialise();
      const nombreFiltré = await pageIndicateurs.getDisplayedIndicateursCount();
      expect(nombreFiltré).toBeLessThanOrEqual(nombreInitial);
      await pageIndicateurs.expectActiveFilterVisible(
        "Indicateurs territorialisés",
      );
    });

    await test.step("Réinitialisation des filtres", async () => {
      await pageIndicateurs.resetFilters();
      await pageIndicateurs.expectIndicateursCount(nombreInitial);
    });

    await test.step("Filtre par indicateurs du baromètre", async () => {
      await pageIndicateurs.filterByBarometre();
      const nombreFiltré = await pageIndicateurs.getDisplayedIndicateursCount();
      expect(nombreFiltré).toBeLessThanOrEqual(nombreInitial);
      await pageIndicateurs.expectActiveFilterVisible(
        "Indicateurs du baromètre",
      );
    });

    await test.step("Réinitialisation des filtres après baromètre", async () => {
      await pageIndicateurs.resetFilters();
      await pageIndicateurs.expectIndicateursCount(nombreInitial);
    });

    await test.step("Navigation via la pagination", async () => {
      await pageIndicateurs.goToNextPage();
      await pageIndicateurs.expectTableRowCount(nombreInitial - 20);
    });

    await test.step("Navigation vers le détail d'un indicateur", async () => {
      await pageIndicateurs.goToPage(1);
      await pageIndicateurs.searchIndicateur("IND-021");
      await pageIndicateurs.clickIndicateurById("IND-021");
      await expect(page).toHaveURL(
        /\/panel-administrateur\/indicateurs\/IND-021/,
      );
    });
  });

  test("doit refuser l'accès aux profils non DITP_ADMIN", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageIndicateurs = new PageAdminIndicateurs(page, e2eContext);

    await test.step("Coordinateur région — pas de lien navbar ni d'accès par URL", async () => {
      await appActions.loginAs(COORDINATEUR_REGION);
      await pageIndicateurs.expectIndicateursDesChantiersLinkNotVisible();
      await page.goto("/panel-administrateur/indicateurs");
      await expect(page).not.toHaveURL(/\/panel-administrateur\/indicateurs/);
    });

    await test.step("Équipe direction de projet — pas de lien navbar ni d'accès par URL", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageIndicateurs.expectIndicateursDesChantiersLinkNotVisible();
      await page.goto("/panel-administrateur/indicateurs");
      await expect(page).not.toHaveURL(/\/panel-administrateur\/indicateurs/);
    });
  });
});
