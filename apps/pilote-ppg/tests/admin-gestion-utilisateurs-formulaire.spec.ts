import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageAdminUtilisateurs } from "./pages/admin/page-utilisateurs";
import { PageUtilisateurFormulaire } from "./pages/admin/page-utilisateur-formulaire";

test("doit valider les champs obligatoires Service et Fonction à la création", async ({
  page,
  e2eContext,
  step,
}) => {
  const appActions = new AppActions(page, e2eContext);
  const pageFormulaire = new PageUtilisateurFormulaire(page, e2eContext);

  await step("Connexion en tant que DITP Admin", async () => {
    await appActions.loginAs();
  });

  await step("Navigation vers la page de création de compte", async () => {
    await pageFormulaire.gotoCreate();
  });

  await step(
    "Remplissage des champs email, nom, prénom et profil sans service ni fonction",
    async () => {
      await pageFormulaire.fillIdentification({
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
      await pageFormulaire.clickNext();
      await pageFormulaire.expectFonctionError();
      await pageFormulaire.expectServiceError();
    },
  );

  await step(
    "Remplissage de Fonction et Service — les erreurs disparaissent",
    async () => {
      await pageFormulaire.fillFonction("Testeur E2E");
      await pageFormulaire.selectService("Préfecture de région");
      await pageFormulaire.expectNoFonctionError();
      await pageFormulaire.expectNoServiceError();
    },
  );
});

test("doit créer un compte puis refuser un second compte avec la même adresse", async ({
  page,
  e2eContext,
  step,
}) => {
  const email = `e2e.creation.${randomUUID().slice(0, 8)}@example.com`;
  e2eContext.track("UTILISATEUR_CREATED", { email });
  const appActions = new AppActions(page, e2eContext);
  const pageFormulaire = new PageUtilisateurFormulaire(page, e2eContext);

  async function submitForm(): Promise<void> {
    await pageFormulaire.gotoCreate();
    await pageFormulaire.fillIdentification({
      email,
      nom: "Creation",
      prenom: "E2E",
    });
    await pageFormulaire.selectProfil("DITP - Pilotage");
    await pageFormulaire.fillFonction("Testeur E2E");
    await pageFormulaire.selectService("Préfecture de région");
    await pageFormulaire.clickNextToReview();
    await pageFormulaire.confirm();
  }

  await step("Connexion en tant que DITP Admin", async () => {
    await appActions.loginAs();
  });

  await step("Création du compte", async () => {
    await submitForm();
    await pageFormulaire.expectUpdateSuccess();
    const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
      where: { email },
      select: { profilCode: true, fonction: true },
    });
    expect(utilisateur).toEqual({
      profilCode: "DITP_PILOTAGE",
      fonction: "Testeur E2E",
    });
  });

  await step(
    "Une seconde création avec la même adresse est refusée",
    async () => {
      await submitForm();
      await pageFormulaire.expectEmailAlreadyUsedError();
      expect(await prisma.utilisateur.count({ where: { email } })).toBe(1);
    },
  );
});

const MODALE_PROFIL = "modale.profil@example.com";

test("doit valider les champs obligatoires à la modification et supprimer la modale après complétion", async ({
  page,
  e2eContext,
  step,
}) => {
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
      await pageUtilisateurs.clickUtilisateurByEmail(MODALE_PROFIL);
      await pageFormulaire.gotoEditFromFiche();
    },
  );

  await step(
    "Clic Suivant — erreurs de validation sur Service et Fonction",
    async () => {
      await pageFormulaire.clickNext();
      await pageFormulaire.expectFonctionError();
      await pageFormulaire.expectServiceError();
    },
  );

  await step(
    "Remplissage de Fonction et Service — passage à l'étape 2",
    async () => {
      e2eContext.track("PROFIL_UTILISATEUR_UPDATED", {
        email: MODALE_PROFIL,
        originalData: {
          fonction: null,
          service: null,
          service_autre: null,
          perimetre_ministeriel: null,
        },
      });
      await pageFormulaire.fillFonction("Coordinateur régional");
      await pageFormulaire.selectService("Préfecture de région");
      await pageFormulaire.clickNext();
      await pageFormulaire.expectNoFonctionError();
      await pageFormulaire.expectNoServiceError();
    },
  );

  await step("Confirmation du récapitulatif — enregistrement", async () => {
    await pageFormulaire.confirm();
    await pageFormulaire.expectUpdateSuccess();
  });

  await step(
    "Re-connexion en coordinateur — la modale ne réapparaît plus",
    async () => {
      const pageAccueil = await appActions.switchUser(MODALE_PROFIL);
      // On attend que la reconnexion soit reellement effective plutot qu'un delai
      // fixe : c'est a ce moment-la que la modale reapparaitrait si le bug revenait.
      await pageAccueil.header.expectUserLoggedIn();
      await expect(modaleCompletezProfil).not.toBeVisible();
    },
  );
});
