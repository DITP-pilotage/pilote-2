import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
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
    await pageAccueil.expectAssistantIAAccess();
  });

  await step(
    "Un utilisateur Services déconcentrés régionaux n'a pas accès",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_PROFIL);
      await pageAccueil.expectNoAssistantIAAccess();
    },
  );

  await step(
    "Le DITP Admin active le profil Services déconcentrés régionaux",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.enableProfil(
        PROFIL_SERVICES_DECONCENTRES_REGION.code,
        PROFIL_SERVICES_DECONCENTRES_REGION.nom,
      );
    },
  );

  await step(
    "L'utilisateur Services déconcentrés régionaux a maintenant accès",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_PROFIL);
      await pageAccueil.expectAssistantIAAccess();
    },
  );

  await step("Un préfet de département n'a pas accès", async () => {
    const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
    await pageAccueil.expectNoAssistantIAAccess();
  });

  await step(
    "Le DITP Admin ajoute le préfet de département par recherche « prénom nom »",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoEmails();
      await pagePermissions.addUtilisateur(
        "departement prefet",
        UTILISATEUR_VIA_EMAIL,
      );
      await pagePermissions.expectNoProfilMention(UTILISATEUR_VIA_EMAIL);
    },
  );

  await step("Le préfet de département a maintenant accès", async () => {
    const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
    await pageAccueil.expectAssistantIAAccess();
  });

  await step(
    "Le DITP Admin active aussi le profil Préfet de département : la liste le signale",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.enableProfil(
        PROFIL_PREFET_DEPARTEMENT.code,
        PROFIL_PREFET_DEPARTEMENT.nom,
      );
      await pagePermissions.gotoEmails();
      await pagePermissions.expectProfilMention(
        UTILISATEUR_VIA_EMAIL,
        PROFIL_PREFET_DEPARTEMENT.nom,
      );
    },
  );

  await step(
    "Le préfet de département a toujours accès via son profil",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
      await pageAccueil.expectAssistantIAAccess();
    },
  );

  await step(
    "Le DITP Admin désactive le profil Préfet de département",
    async () => {
      await appActions.switchUser(ADMIN);
      await pagePermissions.gotoProfils();
      await pagePermissions.disableProfil(PROFIL_PREFET_DEPARTEMENT.nom);
    },
  );

  await step(
    "Le préfet de département garde l'accès grâce à son autorisation individuelle",
    async () => {
      const pageAccueil = await appActions.switchUser(UTILISATEUR_VIA_EMAIL);
      await pageAccueil.expectAssistantIAAccess();
    },
  );
});

test.describe("Appels directs à l'assistant IA", () => {
  test("un compte sans accès à l'assistant ne peut pas lui écrire", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(
      "premiere.ministre@example.com",
    );

    const response = await page.request.post("/api/albert/chat", {
      data: { messages: [] },
    });

    expect(response.status()).toBe(403);
  });

  test("un compte ne télécharge que ses propres rapports", async ({
    page,
    e2eContext,
  }) => {
    await new AppActions(page, e2eContext).loginAs(ADMIN);
    const otherUtilisateur = await prisma.utilisateur.findUniqueOrThrow({
      where: { email: "ditp.pilotage@example.com" },
      select: { id: true },
    });
    const currentUtilisateur = await prisma.utilisateur.findUniqueOrThrow({
      where: { email: ADMIN },
      select: { id: true },
    });

    const otherUtilisateurRapport = await page.request.get(
      `/api/albert/rapports/${otherUtilisateur.id}/rapport-0123abcd.pdf`,
    );
    const invalidFilename = await page.request.get(
      `/api/albert/rapports/${currentUtilisateur.id}/..%2Fsecret.pdf`,
    );
    const missingRapport = await page.request.get(
      `/api/albert/rapports/${currentUtilisateur.id}/rapport-0123abcd.pdf`,
    );

    expect(otherUtilisateurRapport.status()).toBe(403);
    expect(invalidFilename.status()).toBe(400);
    expect(missingRapport.status()).toBe(404);
  });
});
