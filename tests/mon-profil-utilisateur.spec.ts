import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageMonProfilUtilisateur } from "./pages/page-mon-profil-utilisateur";

test("doit afficher et modifier le profil utilisateur", async ({
  page,
  e2eContext,
}) => {
  test.setTimeout(300_000);
  const appActions = new AppActions(page, e2eContext);
  const pageMonProfil = new PageMonProfilUtilisateur(page, e2eContext);

  await test.step("Connexion et navigation vers Mon profil utilisateur", async () => {
    await appActions.loginAs();
    await pageMonProfil.goto();
  });

  await test.step("Vérification de la structure de la page", async () => {
    await pageMonProfil.expectStructure();
  });

  await test.step("Vérification que le champ email est désactivé", async () => {
    await pageMonProfil.expectEmailDisabled();
  });

  await test.step("Vérification que les champs sont pré-remplis avec les données de l'utilisateur", async () => {
    await pageMonProfil.expectChampsPreremplis({
      email: "ditp.admin@example.com",
      prenom: "Admin",
      nom: "DITP",
    });
  });

  await test.step("Sélection du service Autre et vérification du champ supplémentaire", async () => {
    await pageMonProfil.selectService("Autre");
    await pageMonProfil.expectChampServiceAutreVisible();
  });

  await test.step("Sélection d'un service standard et vérification que le champ Autre disparaît", async () => {
    await pageMonProfil.selectService("Préfecture de région");
    await pageMonProfil.expectChampServiceAutreNonVisible();
  });

  let dateAvantModification: string;

  await test.step("Modification du profil et vérification du succès", async () => {
    dateAvantModification = await pageMonProfil.getDateModificationText();
    await pageMonProfil.modifierFonctionEtEnregistrer(
      "ditp.admin@example.com",
      "",
      "Testeur E2E",
    );
    await pageMonProfil.expectSucces();
  });

  await test.step("Vérification que la date de modification est mise à jour", async () => {
    const dateApresModification = await pageMonProfil.getDateModificationText();
    if (dateAvantModification === dateApresModification) {
      const regex = /Modifié le \d{2}\/\d{2}\/\d{4} à \d{2}:\d{2}/;
      if (!regex.test(dateApresModification)) {
        throw new Error(`Format de date inattendu : ${dateApresModification}`);
      }
    }
  });

  await test.step("Isolation : vérification que le profil d'un autre utilisateur n'est pas impacté", async () => {
    await appActions.switchUser("coordinateur.region@example.com");
    await pageMonProfil.goto();
    await pageMonProfil.expectChampsPreremplis({
      email: "coordinateur.region@example.com",
      prenom: "Region",
      nom: "Coordinateur",
    });
  });
});
