import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { loginFn, seedDatabase } from "./utils";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir exporter les données des utilisateurs sous format CSV", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await loginFn({ page });

  await test.step("Navigation vers la page Utilisateur", async () => {
    await page.getByRole("link", { name: /Gestion des comptes/ }).click();
    await page.waitForURL("**/admin/utilisateurs");

    let download: Download;

    await test.step("partie téléchargement et vérification du fichier", async () => {
      await test.step("Téléchargement du fichier", async () => {
        const downloadPromise = page.waitForEvent("download", {
          timeout: 120_000,
        });

        await page
          .getByTestId("form-export")
          .getByRole("button", { name: /Exporter les données/ })
          .click();

        download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(
          /PILOTE-Utilisateurs-.*\.csv/,
        );
      });

      await test.step("vérification du fichier identifiant et cadrage", async () => {
        const contents = await fs.promises.readFile(await download.path());

        expect(contents.toString()).toMatch(
          '"Prénom";"Nom";"Email";"Fonction";"Profil";"Territoire";"Périmètre";"Droit de lecture";"Responsabilité";"Droits de saisie des données quantitatives";"Droits de saisie des commentaires";"Droits de gestion des utilisateurs";"Statut";"Date de création";"Auteur création";"Date de dernière modification";"Auteur dernière modification"\n',
        );
      });
    });
  });
});
