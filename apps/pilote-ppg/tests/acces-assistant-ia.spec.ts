import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageAdminAlbertPermissions } from "./pages/admin/page-admin-albert-permissions";

const ADMIN = "ditp.admin@example.com";
const UTILISATEUR_VIA_PROFIL = "services.deconcentres.region@example.com";
const PROFIL_SERVICES_DECONCENTRES_REGION = {
  code: "SERVICES_DECONCENTRES_REGION",
  nom: "Services déconcentrés régionaux",
};
const UTILISATEUR_VIA_EMAIL = "prefet.departement@example.com";
const PROFIL_PREFET_DEPARTEMENT = {
  code: "PREFET_DEPARTEMENT",
  nom: "Préfet de département et collaborateurs",
};

test("gère les accès à l'assistant IA par profil et par utilisateur", async ({
  page,
  e2eContext,
  step,
}) => {
  const appActions = new AppActions(page, e2eContext);
  const pagePermissions = new PageAdminAlbertPermissions(page, e2eContext);

  await step("Le DITP Admin a accès à l'assistant IA", async () => {
    const pageAccueil = await appActions.loginAs(ADMIN);
    await pageAccueil.expectAccesAssistantIA();
  });

  await step(
    "Un utilisateur Services déconcentrés régionaux n'a pas accès",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_PROFIL);
      await pageAccueil.expectPasAccesAssistantIA();
    },
  );

  await step(
    "Le DITP Admin active le profil Services déconcentrés régionaux",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.activerProfil(
        PROFIL_SERVICES_DECONCENTRES_REGION.code,
        PROFIL_SERVICES_DECONCENTRES_REGION.nom,
      );
    },
  );

  await step(
    "L'utilisateur Services déconcentrés régionaux a maintenant accès",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_PROFIL);
      await pageAccueil.expectAccesAssistantIA();
    },
  );

  await step("Un préfet de département n'a pas accès", async () => {
    const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
    await pageAccueil.expectPasAccesAssistantIA();
  });

  await step(
    "Le DITP Admin ajoute le préfet de département par recherche « prénom nom »",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoEmails();
      await pagePermissions.ajouterUtilisateur(
        "departement prefet",
        UTILISATEUR_VIA_EMAIL,
      );
      await pagePermissions.expectSansMentionProfil(UTILISATEUR_VIA_EMAIL);
    },
  );

  await step("Le préfet de département a maintenant accès", async () => {
    const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
    await pageAccueil.expectAccesAssistantIA();
  });

  await step(
    "Le DITP Admin active aussi le profil Préfet de département : la liste le signale",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.activerProfil(
        PROFIL_PREFET_DEPARTEMENT.code,
        PROFIL_PREFET_DEPARTEMENT.nom,
      );
      await pagePermissions.gotoEmails();
      await pagePermissions.expectMentionProfil(
        UTILISATEUR_VIA_EMAIL,
        PROFIL_PREFET_DEPARTEMENT.nom,
      );
    },
  );

  await step(
    "Le préfet de département a toujours accès via son profil",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
      await pageAccueil.expectAccesAssistantIA();
    },
  );

  await step(
    "Le DITP Admin désactive le profil Préfet de département",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.desactiverProfil(PROFIL_PREFET_DEPARTEMENT.nom);
    },
  );

  await step(
    "Le préfet de département garde l'accès grâce à son autorisation individuelle",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
      await pageAccueil.expectAccesAssistantIA();
    },
  );
});
