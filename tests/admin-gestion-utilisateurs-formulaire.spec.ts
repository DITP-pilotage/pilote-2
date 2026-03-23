import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageAdminUtilisateurs } from "./pages/admin/page-utilisateurs";
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

const MODALE_PROFIL = "modale.profil@example.com";

test("doit valider les champs obligatoires à la modification et supprimer la modale après complétion", async ({
  page,
  e2eContext,
  step,
}) => {
  test.setTimeout(300_000);
  const appActions = new AppActions(page, e2eContext);
  const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);
  const pageFormulaire = new PageUtilisateurFormulaire(page, e2eContext);
  const modaleCompletezProfil = page.getByRole("button", {
    name: "Plus tard",
  });

  await step(
    "Connexion en coordinateur — la modale Complétez votre profil apparaît",
    async () => {
      await appActions.loginAs(MODALE_PROFIL);
      await expect(modaleCompletezProfil).toBeVisible({ timeout: 10_000 });
      await modaleCompletezProfil.click();
    },
  );

  await step("Switch vers DITP Admin", async () => {
    await appActions.switchUser("ditp.admin@example.com");
    const modaleAdmin = page.getByRole("button", { name: "Plus tard" });
    if (await modaleAdmin.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modaleAdmin.click();
    }
  });

  await step(
    "Navigation vers la fiche du coordinateur et clic Modifier",
    async () => {
      await pageUtilisateurs.goto();
      await pageUtilisateurs.clickUtilisateurParEmail(MODALE_PROFIL);
      await pageFormulaire.gotoModifierDepuisFiche();
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
    "Remplissage de Fonction et Service — passage à l'étape 2",
    async () => {
      e2eContext.track("PROFIL_UTILISATEUR_MODIFIE", {
        email: MODALE_PROFIL,
        originalData: {
          fonction: null,
          service: null,
          service_autre: null,
          perimetre_ministeriel: null,
        },
      });
      await pageFormulaire.remplirFonction("Coordinateur régional");
      await pageFormulaire.selectService("Préfecture de région");
      await pageFormulaire.clickSuivant();
      await pageFormulaire.expectPasErreurFonction();
      await pageFormulaire.expectPasErreurService();
    },
  );

  await step("Confirmation du récapitulatif — enregistrement", async () => {
    await pageFormulaire.confirmer();
    await pageFormulaire.expectSuccesModification();
  });

  await step(
    "Re-connexion en coordinateur — la modale ne réapparaît plus",
    async () => {
      await appActions.switchUser(MODALE_PROFIL);
      await page.waitForTimeout(3000);
      await expect(modaleCompletezProfil).not.toBeVisible();
    },
  );
});
