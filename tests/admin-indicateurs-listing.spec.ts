import { expect, test } from "@playwright/test";
import { AppActions } from "./actions/app.actions";
import { PageAdminIndicateurs } from "./pages/admin/page-admin-indicateurs";

const DITP_ADMIN = "ditp.admin@example.com";

test.describe("Listing des indicateurs — Admin", () => {
  test("doit afficher la page de gestion des indicateurs avec la structure attendue", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page);
    const pageIndicateurs = new PageAdminIndicateurs(page);

    await test.step("Connexion en tant que DITP Admin et accès à la page", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageIndicateurs.goto();
      await pageIndicateurs.expectTitrePage();
    });

    await test.step("Vérification de la structure du tableau", async () => {
      await pageIndicateurs.expectColonneVisible("Chantier associé");
      await pageIndicateurs.expectColonneVisible("Nom du chantier");
      await pageIndicateurs.expectColonneVisible("Identifiant indicateur");
      await pageIndicateurs.expectColonneVisible("Nom de l'indicateur");
      await pageIndicateurs.expectColonneVisible("Dernière modification");
      await pageIndicateurs.expectColonneVisible("Actif / Inactif");
    });

    await test.step("Vérification de la présence des éléments de la page", async () => {
      await pageIndicateurs.expectBoutonCreerIndicateurVisible();
      await pageIndicateurs.expectBoutonExporterVisible();
      await pageIndicateurs.expectNombreIndicateursSuperieurA(0);
    });

    const nombreInitial =
      await pageIndicateurs.getNombreIndicateursAffiches();

    await test.step("Vérification de la pagination", async () => {
      await pageIndicateurs.expectPaginationVisible();
      await pageIndicateurs.expectNombreLignesTableau(20);
    });

    await test.step("Recherche d'un indicateur par texte", async () => {
      await pageIndicateurs.rechercherIndicateur("IND-021");
      await pageIndicateurs.expectIndicateurDansTableau("IND-021");
      await pageIndicateurs.expectPaginationNonVisible();
    });

    await test.step("Effacement de la recherche — retour à l'état initial", async () => {
      await pageIndicateurs.effacerRecherche();
      await pageIndicateurs.expectNombreIndicateurs(nombreInitial);
      await pageIndicateurs.expectPaginationVisible();
    });

    await test.step("Filtre par indicateurs territorialisés", async () => {
      await pageIndicateurs.filtrerParTerritorialise();
      const nombreFiltré =
        await pageIndicateurs.getNombreIndicateursAffiches();
      expect(nombreFiltré).toBeLessThanOrEqual(nombreInitial);
      await pageIndicateurs.expectFiltreActifVisible(
        "Indicateurs territorialisés",
      );
    });

    await test.step("Réinitialisation des filtres", async () => {
      await pageIndicateurs.reinitialiserFiltres();
      await pageIndicateurs.expectNombreIndicateurs(nombreInitial);
    });

    await test.step("Filtre par indicateurs du baromètre", async () => {
      await pageIndicateurs.filtrerParBarometre();
      const nombreFiltré =
        await pageIndicateurs.getNombreIndicateursAffiches();
      expect(nombreFiltré).toBeLessThanOrEqual(nombreInitial);
      await pageIndicateurs.expectFiltreActifVisible(
        "Indicateurs du baromètre",
      );
    });

    await test.step("Réinitialisation des filtres après baromètre", async () => {
      await pageIndicateurs.reinitialiserFiltres();
      await pageIndicateurs.expectNombreIndicateurs(nombreInitial);
    });

    await test.step("Navigation via la pagination", async () => {
      await pageIndicateurs.allerPageSuivante();
      await pageIndicateurs.expectNombreLignesTableau(
        nombreInitial - 20,
      );
    });

    await test.step("Navigation vers le détail d'un indicateur", async () => {
      await pageIndicateurs.allerPage(1);
      await pageIndicateurs.rechercherIndicateur("IND-021");
      await pageIndicateurs.clickIndicateurParId("IND-021");
      await expect(page).toHaveURL(/\/admin\/indicateurs\/IND-021/);
    });
  });
});
