import { Download, expect, test } from "@playwright/test";
import fs from "node:fs";
import { AppActions } from "./actions/app.actions";
import { PageAdminUtilisateurs } from "./pages/admin/page-utilisateurs";

test("doit pouvoir exporter les données des utilisateurs sous format CSV", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const appActions = new AppActions(page);
  await appActions.loginAs();

  let download: Download;

  await test.step("Navigation vers la page Utilisateur", async () => {
    const pageUtilisateurs = new PageAdminUtilisateurs(page);
    await pageUtilisateurs.goto();

    await test.step("Téléchargement du fichier", async () => {
      download = await pageUtilisateurs.exportCsv();

      expect(download.suggestedFilename()).toMatch(
        /PILOTE-Utilisateurs-.*\.csv/,
      );
    });

    await test.step("vérification du fichier utilisateur", async () => {
      const contents = await fs.promises.readFile(await download.path());

      expect(contents.toString()).toMatch(
        '"Prénom";"Nom";"Email";"Fonction";"Profil";"Périmètre ministériel";"Service";"Territoire";"Périmètre";"Droit de lecture";"Responsabilité";"Droits de saisie des données quantitatives";"Droits de saisie des commentaires";"Droits de gestion des utilisateurs";"Statut";"Date de création";"Auteur création";"Date de dernière modification";"Auteur dernière modification"\n',
      );
    });
  });
});
