import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageMonProfilUtilisateur } from "./pages/page-mon-profil-utilisateur";

async function dateDeModification(email: string): Promise<Date> {
  const compte = await prisma.utilisateur.findUniqueOrThrow({
    where: { email },
    select: { date_modification: true },
  });
  return compte.date_modification;
}

function formatParis(date: Date): string {
  const jour = date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const heure = date.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${jour} à ${heure}`;
}

test("doit afficher et modifier le profil utilisateur", async ({
  page,
  e2eContext,
  step,
}) => {
  const appActions = new AppActions(page, e2eContext);
  const pageMonProfil = new PageMonProfilUtilisateur(page, e2eContext);

  await step(
    "Connexion et navigation vers Mon profil utilisateur",
    async () => {
      await appActions.loginAs();
      await pageMonProfil.goto();
    },
  );

  await step("Vérification de la structure de la page", async () => {
    await pageMonProfil.expectStructure();
  });

  await step("Vérification que le champ email est désactivé", async () => {
    await pageMonProfil.expectEmailDisabled();
  });

  await step("Vérification que les champs sont pré-remplis", async () => {
    await pageMonProfil.expectChampsPreremplis({
      email: "ditp.admin@example.com",
      prenom: "Admin",
      nom: "DITP",
    });
  });

  await step(
    "Sélection du service Autre — champ supplémentaire visible",
    async () => {
      await pageMonProfil.selectService("Autre");
      await pageMonProfil.expectChampServiceAutreVisible();
    },
  );

  await step(
    "Sélection d'un service standard — champ Autre disparaît",
    async () => {
      await pageMonProfil.selectService("Préfecture de région");
      await pageMonProfil.expectChampServiceAutreNonVisible();
    },
  );

  let dateAvantModification: Date;

  await step("Modification du profil et vérification du succès", async () => {
    dateAvantModification = await dateDeModification("ditp.admin@example.com");
    await pageMonProfil.modifierFonctionEtEnregistrer(
      "ditp.admin@example.com",
      "Testeur E2E",
    );
    await pageMonProfil.expectSucces();
  });

  await step(
    "Vérification que la modification est enregistrée et datée",
    async () => {
      const compte = await prisma.utilisateur.findUniqueOrThrow({
        where: { email: "ditp.admin@example.com" },
        select: { fonction: true, service: true, date_modification: true },
      });
      expect(compte.fonction).toBe("Testeur E2E");
      expect(compte.service).toBe("prefecture-de-region");
      expect(compte.date_modification.getTime()).toBeGreaterThan(
        dateAvantModification.getTime(),
      );
      await expect(pageMonProfil.dateModification).toHaveText(
        `Modifié le ${formatParis(compte.date_modification)}`,
      );
    },
  );

  await step(
    "Isolation : profil d'un autre utilisateur non impacté",
    async () => {
      await appActions.switchUser("coordinateur.region@example.com");
      await pageMonProfil.goto();
      await pageMonProfil.expectChampsPreremplis({
        email: "coordinateur.region@example.com",
        prenom: "Region",
        nom: "Coordinateur",
      });
    },
  );
});
