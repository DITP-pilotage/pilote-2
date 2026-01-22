import { Page } from "playwright-core";
import { expect, test } from "@playwright/test";
import { execSync } from "child_process";

export const seedDatabase = () =>
  execSync("./tests/seed/seed.sh", {
    stdio: "inherit",
    cwd: process.cwd(),
  });

export const loginFn = async ({ page }: { page: Page }) => {
  const username = process.env.E2E_USERNAME!;
  const password = process.env.DEV_PASSWORD!;

  await test.step(`Authentification de l'utilisateur ${username} avec le rôle DITP_ADMIN`, async () => {
    test.setTimeout(150_000);
    await page.goto("/");

    await page
      .getByRole("banner")
      .getByRole("button", { name: "Se connecter" })
      .click();

    await page.waitForURL("**/api/auth/signin**", { timeout: 60_000 });

    await page.getByLabel("Identifiant").fill(username);
    await page.getByLabel(/Mot de passe/).fill(password);

    await page.getByRole("button").click();

    await page.waitForURL("**/accueil/chantier/**", { timeout: 60_000 });

    const isModalVideoAccueilVisible = await page
      .getByText(
        "Retrouvez cette vidéo et d'autres ressources dans le centre d'aide de PILOTE",
      )
      .isVisible();
    const isModalNewsletterVisible = await page
      .getByText("Ne manquez pas les actualités de PILOTE")
      .isVisible();

    if (isModalVideoAccueilVisible || isModalNewsletterVisible) {
      await page.getByRole("button", { name: /Fermer.*/ }).click();
    }
  });
};

export const authentificationApiFn = async ({
  page,
  apiUsername,
}: {
  page: Page;
  apiUsername: string;
}): Promise<{ apiToken: string }> => {
  let apiToken: string = "";

  await loginFn({ page });

  await test.step(`Création du token API pour l'utilisateur ${apiUsername}`, async () => {
    await page.goto("/admin/gestion-token-api");
    await page.waitForURL("**/admin/gestion-token-api");

    expect(page.getByText(apiUsername)).not.toBeVisible();

    await page.getByLabel("Émail").fill(apiUsername);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/gestionTokenAPI.creerTokenAPI") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: /Créer un token API/ }).click();

    const response = await responsePromise;
    const responseBody = await response.json();

    apiToken = responseBody[0].result.data.json;
  });

  return { apiToken };
};

export const authentificationApiDITPADMINFn = async ({
  page,
}: {
  page: Page;
}): Promise<{ apiDITPADMINToken: string; apiDITPADMINUsername: string }> => {
  const apiDITPADMINUsername = "ditp.admin@example.com";

  const { apiToken } = await authentificationApiFn({
    page,
    apiUsername: apiDITPADMINUsername,
  });

  return { apiDITPADMINUsername, apiDITPADMINToken: apiToken };
};

export const authentificationApiDirProjetFn = async ({
  page,
}: {
  page: Page;
}): Promise<{
  apiDirProjetToken: string;
  apiDirProjetUsername: string;
  apiDirProjetChantierAssocie: string;
  apiDirProjetIndicateurAssocie: string;
}> => {
  const apiDirProjetUsername = "equipe.dir.projet@example.com";
  const apiDirProjetChantierAssocie = "CH-129";
  const apiDirProjetIndicateurAssocie = "IND-021";

  const { apiToken } = await authentificationApiFn({
    page,
    apiUsername: apiDirProjetUsername,
  });

  return {
    apiDirProjetUsername,
    apiDirProjetToken: apiToken,
    apiDirProjetChantierAssocie,
    apiDirProjetIndicateurAssocie,
  };
};

export const suppressionAuthentificationApiFn = async ({
  page,
  apiUsername,
}: {
  page: Page;
  apiUsername: string;
}): Promise<{ apiToken: string }> => {
  let apiToken: string = "";

  await test.step(`Suppression du token API pour l'utilisateur ${apiUsername}`, async () => {
    await page.goto("/admin/gestion-token-api");
    await page.waitForURL("**/admin/gestion-token-api");

    expect(page.getByRole("cell", { name: apiUsername })).toBeVisible();

    await page
      .getByRole("cell", { name: apiUsername })
      .locator("..")
      .getByRole("button", { name: /Supprimer le token API/ })
      .click();

    await page.waitForURL(
      "**/admin/gestion-token-api?_action=suppression-reussie",
    );
  });

  return { apiToken };
};
