import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageUtilisateurFormulaire } from "./pages/admin/page-utilisateur-formulaire";

test("doit valider les champs obligatoires Service et Fonction à la création", async ({
  page,
  e2eContext,
  step,
}) => {
  test.setTimeout(300_000);
  const appActions = new AppActions(page, e2eContext);
  const pageFormulaire = new PageUtilisateurFormulaire(page, e2eContext);

  await step("Connexion en tant que DITP Admin", async () => {
    await appActions.loginAs();
  });

  await step("Navigation vers la page de création de compte", async () => {
    await pageFormulaire.gotoCreer();
  });

  await step(
    "Remplissage des champs email, nom, prénom et profil sans service ni fonction",
    async () => {
      await pageFormulaire.remplirIdentification({
        email: "test.validation@gouv.fr",
        nom: "Test",
        prenom: "Validation",
      });
      await pageFormulaire.selectProfil("DITP - Admin");
    },
  );

  await step(
    "Clic Suivant — erreurs de validation sur Service et Fonction",
    async () => {
      await pageFormulaire.clickSuivant();
      await pageFormulaire.expectErreurFonction();
      await pageFormulaire.expectErreurService();
    },
  );

  await step(
    "Remplissage de Fonction et Service — les erreurs disparaissent",
    async () => {
      await pageFormulaire.remplirFonction("Testeur E2E");
      await pageFormulaire.selectService("Préfecture de région");
      await pageFormulaire.expectPasErreurFonction();
      await pageFormulaire.expectPasErreurService();
    },
  );
});
