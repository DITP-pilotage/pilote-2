import { test, expect } from "@playwright/test";
import { AppActions } from "./actions/app.actions";
import { E2ETestContext } from "./e2e-test-context";

const CHANTIER = { id: "CH-050", nom: "Sécurité routière" };

const chunks = [
  { type: "start" },
  { type: "start-step" },
  {
    type: "tool-input-available",
    toolCallId: "appel-1",
    toolName: "search_chantiers",
    input: { query: "sécurité routière" },
  },
  {
    type: "tool-output-available",
    toolCallId: "appel-1",
    output: {
      chantiers: [CHANTIER],
      reasoning: "",
      _output_instructions: "",
    },
  },
  { type: "text-start", id: "texte-1" },
  {
    type: "text-delta",
    id: "texte-1",
    delta: `Le chantier **${CHANTIER.id} — ${CHANTIER.nom}** est concerné.`,
  },
  { type: "text-end", id: "texte-1" },
  { type: "finish-step" },
  { type: "finish" },
];

const corpsFluxSSE = [
  ...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
  "data: [DONE]\n\n",
].join("");

test.describe("Albert — liens vers les chantiers et conversation minimisée", () => {
  test("cliquer un chantier ouvre sa fiche et conserve la conversation", async ({
    page,
  }) => {
    const actions = new AppActions(page, new E2ETestContext());
    await actions.loginAs();

    await page.route("**/api/albert/chat", (route) =>
      route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body: corpsFluxSSE,
      }),
    );

    await page.getByRole("button", { name: "Ouvrir Albert" }).first().click();
    await page
      .getByPlaceholder("Posez une question sur ce territoire...")
      .fill("Quels chantiers sur la sécurité routière ?");
    await page.getByRole("button", { name: "Envoyer le message" }).click();

    const lien = page.getByRole("link", {
      name: `${CHANTIER.id} — ${CHANTIER.nom}`,
    });
    await expect(lien).toBeVisible();

    await lien.click();

    await expect(page).toHaveURL(new RegExp(`/chantier/${CHANTIER.id}/`));
    await expect(
      page.getByRole("button", { name: "Reprendre la conversation" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Reprendre la conversation" })
      .click();
    await expect(lien).toBeVisible();
  });
});
