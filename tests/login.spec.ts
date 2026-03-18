import { test } from "./fixtures";
import { PageAccueilNonConnecte } from "./pages/page-accueil-non-connecte";
import { AppActions } from "./actions/app.actions";

test("doit arriver sur la landing page", async ({ page, e2eContext }) => {
  const pageAccueilNonConnecte = new PageAccueilNonConnecte(page, e2eContext);
  await pageAccueilNonConnecte.goto();
});

test("doit pouvoir se connecter", async ({ page, e2eContext }) => {
  test.setTimeout(150_000);
  const appActions = new AppActions(page, e2eContext);
  const pageAccueil = await appActions.loginAs();
  await pageAccueil.header.expectUserLoggedIn();
});
