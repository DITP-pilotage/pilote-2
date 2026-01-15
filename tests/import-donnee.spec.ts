import { expect, test } from "@playwright/test";
import { stringify } from "csv-stringify/sync";
import { seedDatabase } from "./utils";
import { AppActions } from "./actions/app.actions";

test.beforeAll(() => {
  seedDatabase();
});

test("doit pouvoir importer des données", async ({ page }) => {
  const chantier = {
    id: "129",
    nom: "Moderniser la gestion des ressources",
    indicateurId: "IND-021",
    indicateurNom: "Nombre de conformité aux standards",
  };

  const appActions = new AppActions(page);
  const pageAccueil = await appActions.loginAs();

  await test.step(`Navigation vers la page chantier "${chantier.nom}"`, async () => {
    await expect(
      page.getByRole("table").getByRole("cell", { name: chantier.nom }),
    ).toBeVisible();
    const pageChantier = await pageAccueil.selectChantier(
      chantier.nom,
      chantier.id,
    );

    await test.step('Navigation vers la page "Mise à jour des données"', async () => {
      await expect(
        page.getByRole("link", { name: /Mettre à jour les données/ }),
      ).toBeVisible();
      const pageMaj = await pageChantier.gotoMiseAJourDonnees(chantier.id);

      await test.step(`Sélection de l'indicateur ${chantier.indicateurId}`, async () => {
        await pageMaj.expectTitle(chantier.id);
        await pageMaj.selectIndicateur(
          chantier.indicateurId,
          chantier.indicateurNom,
        );
      });

      await test.step("Passage à l'étape suivante 'Charger le fichier'", async () => {
        await pageMaj.nextStep();
        await page.waitForURL(
          `**/chantier/CH-${chantier.id}/indicateurs?etapeCourante=2**`,
        );
        await pageMaj.expectStep(2);
      });

      await test.step("Choix d'un fichier contenant des erreurs", async () => {
        const invalidCsv = stringify(
          [
            ["IND-97", "D12", "Aveyron", "2023-03-31", "va", "5"],
            [
              chantier.indicateurId,
              "D13",
              "Bouches-du-Rhône",
              "2023-01-17",
              "va",
              "12",
            ],
            [
              chantier.indicateurId,
              "D14",
              "Calvados",
              "2023-02-26",
              "va",
              "20",
            ],
          ],
          {
            header: true,
            columns: [
              "identifiant_indic",
              "zone_id",
              "zone_nom",
              "date_valeur",
              "type_valeur",
              "valeur",
            ],
          },
        );

        await pageMaj.uploadFile(`${chantier.indicateurId}.csv`, invalidCsv);
      });

      await test.step("Action de vérification du fichier", async () => {
        await pageMaj.verifyFile();
      });

      await test.step("Vérification que le fichier n'est pas conforme", async () => {
        await pageMaj.expectFileInvalid();
        await expect(
          page.getByText(/IND-97 ne respecte pas le motif imposé/),
        ).toBeVisible();
        await expect(
          page.getByText(
            `L'indicateur IND-97 ne correpond pas à l'indicateur choisis (${chantier.indicateurId})`,
          ),
        ).toBeVisible({ timeout: 30_000 });
      });

      await test.step("Choix d'un fichier valide", async () => {
        const validCsv = stringify(
          [
            [chantier.indicateurId, "D12", "Aveyron", "2023-03-31", "va", "5"],
            [
              chantier.indicateurId,
              "D13",
              "Bouches-du-Rhône",
              "2023-01-17",
              "va",
              "12",
            ],
            [
              chantier.indicateurId,
              "D14",
              "Calvados",
              "2023-02-26",
              "va",
              "20",
            ],
          ],
          {
            header: true,
            columns: [
              "identifiant_indic",
              "zone_id",
              "zone_nom",
              "date_valeur",
              "type_valeur",
              "valeur",
            ],
          },
        );

        await pageMaj.uploadFile(`${chantier.indicateurId}.csv`, validCsv);
      });

      await test.step("Action de vérification du fichier", async () => {
        await pageMaj.verifyFile();
      });

      await test.step("Vérification que le fichier est conforme", async () => {
        await pageMaj.expectFileValid();
      });

      await test.step('Passage à l\'étape suivante "Transmettre les données"', async () => {
        await pageMaj.nextStep();
        await page.waitForURL(
          `**/chantier/CH-${chantier.id}/indicateurs?etapeCourante=3**`,
        );
        await pageMaj.expectStep(3);
      });

      await test.step("Action de transmissions des données vérifiés", async () => {
        await pageMaj.submitData();
      });

      await test.step("Vérification que les données ont correctement été transmises", async () => {
        await pageMaj.expectImportSuccess(chantier.indicateurId);
      });
    });
  });
});
