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
    await assistant.expectClosed();
  });

  await step("La première ouverture se fait en plein écran", async () => {
    await assistant.open();
    await assistant.expectModal();
    await assistant.expectViewSelector();
  });

  await step(
    "Passer en panneau latéral conserve le texte en cours de saisie",
    async () => {
      await assistant.fillInput("Quels chantiers sont en retard ?");
      await assistant.chooseView("Panneau latéral");
      await assistant.expectPanel();
      await assistant.expectInput("Quels chantiers sont en retard ?");
    },
  );

  await step("Le panneau reste ouvert en changeant de page", async () => {
    await page.getByRole("link", { name: "Accueil" }).first().click();
    await page.waitForURL("**/accueil/**");
    await assistant.expectPanel();
  });

  await step(
    "Le panneau s'élargit au clavier, sans priver la page de place",
    async () => {
      await assistant.expectPanelWidth(520);
      await assistant.widenPanelWithKeyboard();
      await assistant.expectPanelWidth(540);
      await assistant.widenPanelWithKeyboard();
      await assistant.expectPanelWidth(540);
    },
  );

  await step(
    "Sur un écran moyen, le panneau devient une fenêtre flottante",
    async () => {
      await page.setViewportSize(ECRAN_MOYEN);
      await assistant.expectFloatingWindow();
      await page.setViewportSize(ECRAN_LARGE);
      await assistant.expectPanel();
      await assistant.expectPanelWidth(540);
    },
  );

  await step(
    "Masquer une conversation vide laisse la pastille de départ, qui rouvre la même vue",
    async () => {
      await assistant.hide();
      await assistant.expectClosed();
      await assistant.open();
      await assistant.expectPanel();
    },
  );

  await step("L'historique s'ouvre depuis le titre", async () => {
    await assistant.openHistory();
    await assistant.expectHistory();
    await page.keyboard.press("Escape");
  });

  await step("Une nouvelle conversation repart de zéro", async () => {
    await assistant.startNewConversation();
    await assistant.expectInput("");
  });

  await step(
    "Rouvrir l'assistant reprend la dernière vue choisie",
    async () => {
      await assistant.chooseView("Fenêtre flottante");
      await assistant.expectFloatingWindow();
      await assistant.hide();
      await assistant.open();
      await assistant.expectFloatingWindow();
    },
  );

  await step(
    "Sur un écran étroit, seul le plein écran est proposé",
    async () => {
      await page.setViewportSize(ECRAN_ETROIT);
      await assistant.expectModal();
      await assistant.expectNoViewSelector();
    },
  );
});
