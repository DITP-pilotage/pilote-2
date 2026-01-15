import { test } from "@playwright/test";
import { seedDatabase } from "./utils";
import { PageAccueilNonConnecte } from "./pages/page-accueil-non-connecte";
import { AppActions } from "./actions/app.actions";

test.beforeAll(() => {
  seedDatabase();
});

test("doit arriver sur la landing page", async ({ page }) => {
  const pageAccueilNonConnecte = new PageAccueilNonConnecte(page);
  await pageAccueilNonConnecte.goto();
  await pageAccueilNonConnecte.expectTitle();
});

test("doit pouvoir se connecter", async ({ page }) => {
  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();
  await pageAccueil.header.expectUserLoggedIn(process.env.E2E_USERNAME!);
});
