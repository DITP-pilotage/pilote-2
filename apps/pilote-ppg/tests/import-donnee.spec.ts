import { expect } from "@playwright/test";
import { stringify } from "csv-stringify/sync";
import { test } from "./fixtures";
import { construireXlsx } from "@/server/import-indicateur/app/builder/TabularFile.builder";
import { AppActions } from "./actions/app.actions";
import { PageMiseAJourDonnees } from "./pages/page-mise-a-jour-donnees";
import {
  CHANTIER_FOR_WRITES,
  INDICATEUR_FOR_IMPORT,
} from "./seed/dedicated-entities";

test("doit pouvoir importer des données", async ({ page, e2eContext }) => {
  const chantier = {
    id: "902",
    indicateurId: INDICATEUR_FOR_IMPORT,
    indicateurNom: "Indicateur e2e import",
  };

  await new AppActions(page, e2eContext).loginAs();
  const pageMaj = new PageMiseAJourDonnees(page, e2eContext);

  await test.step('Navigation vers la page "Mise à jour des données"', async () => {
    await pageMaj.goto(CHANTIER_FOR_WRITES);

    await test.step(`Sélection de l'indicateur ${chantier.indicateurId}`, async () => {
      await pageMaj.expectTitle(chantier.id);
      await pageMaj.selectIndicateur(
        chantier.indicateurId,
        chantier.indicateurNom,
      );
    });

    await test.step("Passage à l'étape suivante 'Charger le fichier'", async () => {
      await pageMaj.nextStep();
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
          [chantier.indicateurId, "D14", "Calvados", "2023-02-26", "va", "20"],
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
      await pageMaj.verifyFile(process.env.E2E_USERNAME!);
    });

    await test.step("Vérification que le fichier n'est pas conforme", async () => {
      await pageMaj.expectFileInvalid();
      // Le message vient du catalogue FR de l'application.
      await expect(
        page.getByText(
          "'IND-97' n'est pas un identifiant d'indicateur valide : il doit être composé de 'IND-' suivi de 3 ou 4 chiffres. Exemple attendu : IND-001. Vous pouvez vous référer au guide des indicateurs pour trouver celui de votre indicateur.",
        ),
      ).toBeVisible();
      // Pas de second message sur la même cellule : un identifiant illisible
      // se corrige d'un seul geste, que le reproche porte sur sa forme ou
      // sur l'indicateur visé. Verrouillé côté serveur dans
      // VerifierFichierIndicateurImporteUseCase.integration.test.ts.
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
          [chantier.indicateurId, "D14", "Calvados", "2023-02-26", "va", "20"],
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
      await pageMaj.verifyFile(process.env.E2E_USERNAME!);
    });

    await test.step("Vérification que le fichier est conforme", async () => {
      await pageMaj.expectFileValid();
    });

    await test.step('Passage à l\'étape suivante "Transmettre les données"', async () => {
      await pageMaj.nextStep();
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

test("doit pouvoir importer un fichier Excel dont les dates sont au format date", async ({
  page,
  e2eContext,
}) => {
  const chantier = {
    id: "902",
    indicateurId: INDICATEUR_FOR_IMPORT,
    indicateurNom: "Indicateur e2e import",
  };

  await new AppActions(page, e2eContext).loginAs();
  const pageMaj = new PageMiseAJourDonnees(page, e2eContext);
  await pageMaj.goto(CHANTIER_FOR_WRITES);
  await pageMaj.expectTitle(chantier.id);
  await pageMaj.selectIndicateur(chantier.indicateurId, chantier.indicateurNom);
  await pageMaj.nextStep();
  await pageMaj.expectStep(2);

  await test.step("Choix d'un fichier Excel dont la colonne date_valeur est typée date", async () => {
    const classeur = construireXlsx([
      [
        "identifiant_indic",
        "zone_id",
        "zone_nom",
        "date_valeur",
        "type_valeur",
        "valeur",
      ],
      [
        chantier.indicateurId,
        "D15",
        "Cantal",
        { date: "2023-03-31" },
        "va",
        "5",
      ],
      [
        chantier.indicateurId,
        "D16",
        "Charente",
        { date: "2023-01-17" },
        "va",
        "12",
      ],
    ]);

    await pageMaj.uploadFile(`${chantier.indicateurId}.xlsx`, classeur);
  });

  await test.step("Vérification que le fichier est conforme", async () => {
    await pageMaj.verifyFile(process.env.E2E_USERNAME!);
    await pageMaj.expectFileValid();
  });

  await test.step("Transmission des données vérifiées", async () => {
    await pageMaj.nextStep();
    await pageMaj.expectStep(3);
    await pageMaj.submitData();
    await pageMaj.expectImportSuccess(chantier.indicateurId);
  });
});
