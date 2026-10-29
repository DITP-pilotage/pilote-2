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

  await step("La pastille est affichée hors de l'accueil", async () => {
    await page.setViewportSize(ECRAN_LARGE);
    await appActions.loginAs(ADMIN);
    await page.goto("/nouveautes");
    await assistant.expectFerme();
  });

  await step("La première ouverture se fait en plein écran", async () => {
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
    "Le panneau s'élargit au clavier, sans priver la page de place",
    async () => {
      await assistant.expectLargeurPanneau(520);
      await assistant.elargirPanneauAuClavier();
      await assistant.expectLargeurPanneau(540);
      await assistant.elargirPanneauAuClavier();
      await assistant.expectLargeurPanneau(540);
    },
  );

  await step(
    "Sur un écran moyen, le panneau devient une fenêtre flottante",
    async () => {
      await page.setViewportSize(ECRAN_MOYEN);
      await assistant.expectFenetre();
      await page.setViewportSize(ECRAN_LARGE);
      await assistant.expectPanneau();
      await assistant.expectLargeurPanneau(540);
    },
  );

  await step("Masquer l'assistant le garde en bas à droite", async () => {
    await assistant.masquer();
    await assistant.expectMasquee();
    await assistant.reprendreLaConversation();
    await assistant.expectPanneau();
  });

  await step("L'historique s'ouvre depuis le titre", async () => {
    await assistant.ouvrirHistorique();
    await assistant.expectHistorique();
    await page.keyboard.press("Escape");
  });

  await step("Une nouvelle conversation repart de zéro", async () => {
    await assistant.nouvelleConversation();
    await assistant.expectSaisie("");
  });

  await step(
    "Rouvrir l'assistant reprend la dernière vue choisie",
    async () => {
      await assistant.choisirVue("Fenêtre flottante");
      await assistant.expectFenetre();
      await assistant.masquer();
      await assistant.reprendreLaConversation();
      await assistant.expectFenetre();
    },
  );

  await step(
    "Sur un écran étroit, seul le plein écran est proposé",
    async () => {
      await page.setViewportSize(ECRAN_ETROIT);
      await assistant.expectModale();
      await assistant.expectSansSelecteurVue();
    },
  );
});
