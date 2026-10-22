import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageMonProfilUtilisateur } from "./pages/page-mon-profil-utilisateur";

async function getModificationDate(email: string): Promise<Date> {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
    where: { email },
    select: { date_modification: true },
  });
  return utilisateur.date_modification;
}

function formatParisDateTime(date: Date): string {
  const day = date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const time = date.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} à ${time}`;
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
    await pageMonProfil.expectPrefilledFields({
      email: "ditp.admin@example.com",
      prenom: "Admin",
      nom: "DITP",
    });
  });

  await step(
    "Sélection du service Autre — champ supplémentaire visible",
    async () => {
      await pageMonProfil.selectService("Autre");
      await pageMonProfil.expectServiceAutreFieldVisible();
    },
  );

  await step(
    "Sélection d'un service standard — champ Autre disparaît",
    async () => {
      await pageMonProfil.selectService("Préfecture de région");
      await pageMonProfil.expectServiceAutreFieldNotVisible();
    },
  );

  let modificationDateBefore: Date;

  await step("Modification du profil et vérification du succès", async () => {
    modificationDateBefore = await getModificationDate(
      "ditp.admin@example.com",
    );
    await pageMonProfil.updateFonctionAndSave(
      "ditp.admin@example.com",
      "Testeur E2E",
    );
    await pageMonProfil.expectSuccess();
  });

  await step(
    "Vérification que la modification est enregistrée et datée",
    async () => {
      const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
        where: { email: "ditp.admin@example.com" },
        select: { fonction: true, service: true, date_modification: true },
      });
      expect(utilisateur.fonction).toBe("Testeur E2E");
      expect(utilisateur.service).toBe("prefecture-de-region");
      expect(utilisateur.date_modification.getTime()).toBeGreaterThan(
        modificationDateBefore.getTime(),
      );
      await expect(pageMonProfil.dateModification).toHaveText(
        `Modifié le ${formatParisDateTime(utilisateur.date_modification)}`,
      );
    },
  );

  await step(
    "Isolation : profil d'un autre utilisateur non impacté",
    async () => {
      await appActions.switchUser("coordinateur.region@example.com");
      await pageMonProfil.goto();
      await pageMonProfil.expectPrefilledFields({
        email: "coordinateur.region@example.com",
        prenom: "Region",
        nom: "Coordinateur",
      });
    },
  );
});
