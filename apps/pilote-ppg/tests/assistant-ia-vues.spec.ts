import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { AssistantIAComponent } from "./components/assistant-ia.component";

const ADMIN = "ditp.admin@example.com";
const ECRAN_LARGE = { width: 1440, height: 900 };
const ECRAN_MOYEN = { width: 1280, height: 800 };
const ECRAN_ETROIT = { width: 375, height: 812 };

test("ouvre l'assistant IA depuis n'importe quelle page et retient la vue choisie", async ({
  page,
  e2eContext,
  step,
}) => {
  const appActions = new AppActions(page, e2eContext);
  const assistant = new AssistantIAComponent(page);

  await step("Le lanceur est affiché hors de l'accueil", async () => {
    await page.setViewportSize(ECRAN_LARGE);
    await appActions.loginAs(ADMIN);
    await page.goto("/nouveautes");
    await assistant.expectFerme();
  });

  await step("La première ouverture se fait en modale", async () => {
    await assistant.ouvrir();
    await assistant.expectModale();
    await assistant.expectSelecteurVue();
  });

  await step(
    "Passer en panneau latéral conserve le texte en cours de saisie",
    async () => {
      await assistant.saisir("Quels chantiers sont en retard ?");
      await assistant.choisirVue("Panneau latéral");
      await assistant.expectPanneau();
      await assistant.expectSaisie("Quels chantiers sont en retard ?");
    },
  );

  await step("Le panneau reste ouvert en changeant de page", async () => {
    await page.getByRole("link", { name: "Accueil" }).first().click();
    await page.waitForURL("**/accueil/**");
    await assistant.expectPanneau();
  });

  await step(
    "Sur un écran moyen, le panneau devient une fenêtre flottante",
    async () => {
      await page.setViewportSize(ECRAN_MOYEN);
      await assistant.expectFenetre();
      await page.setViewportSize(ECRAN_LARGE);
      await assistant.expectPanneau();
    },
  );

  await step(
    "Rouvrir l'assistant reprend la dernière vue choisie",
    async () => {
      await assistant.choisirVue("Fenêtre flottante");
      await assistant.expectFenetre();
      await assistant.fermer();
      await assistant.expectFerme();
      await assistant.ouvrir();
      await assistant.expectFenetre();
    },
  );

  await step("Sur un écran étroit, seule la modale est proposée", async () => {
    await page.setViewportSize(ECRAN_ETROIT);
    await assistant.expectModale();
    await assistant.expectSansSelecteurVue();
  });
});
