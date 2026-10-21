import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageGestionTokenApi } from "./pages/admin/page-gestion-token-api";

// Compte réservé à ce spec : aucun autre test ne lui crée de token.
const EMAIL = "cabinet.mtfp@example.com";

test("un token API créé par l'administrateur donne accès aux données de l'open-api jusqu'à sa suppression", async ({
  page,
  e2eContext,
  openApiSansAuthentification,
  step,
}) => {
  e2eContext.track("TOKEN_API_CREE", { email: EMAIL });
  const pageTokens = new PageGestionTokenApi(page, e2eContext);
  let token = "";

  await step("Création du token par l'administrateur DITP", async () => {
    await new AppActions(page, e2eContext).loginAs("ditp.admin@example.com");
    await pageTokens.goto();
    token = await pageTokens.createToken(EMAIL);
    expect(token).not.toBe("");
  });

  await step("Le token ouvre l'open-api", async () => {
    const client = await openApiSansAuthentification({
      value: `Bearer ${token}`,
    });
    const reponse = await client.getChantierDonnees("CH-129");
    expect(reponse.status()).toBe(200);
    expect(await reponse.json()).toMatchObject({ chantier_id: "CH-129" });
  });

  await step("Après suppression, le token est refusé", async () => {
    await pageTokens.goto();
    await pageTokens.deleteToken(EMAIL);
    await expect(page.getByRole("cell", { name: EMAIL })).toHaveCount(0);
    const client = await openApiSansAuthentification({
      value: `Bearer ${token}`,
    });
    const reponse = await client.getChantierDonnees("CH-129");
    expect(reponse.status()).toBe(403);
  });
});
