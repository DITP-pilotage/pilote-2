import { expect, test } from "@playwright/test";
import { AppActions } from "./actions/app.actions";
import { PageAdminUtilisateurs } from "./pages/admin/page-utilisateurs";
import { PageUtilisateurDetail } from "./pages/admin/page-utilisateur-detail";

const DITP_ADMIN = "ditp.admin@example.com";
const COORDINATEUR_REGION = "coordinateur.region@example.com";
const COORDINATEUR_DEPARTEMENT = "coordinateur.departement@example.com";
const SECRETARIAT_GENERAL = "secretariat.general@example.com";
const PREFET_REGION = "prefet.region@example.com";
const PREFET_DEPARTEMENT = "prefet.departement@example.com";
const EQUIPE_DIR_PROJET = "equipe.dir.projet@example.com";
const SERVICES_DECONCENTRES_REGION = "services.deconcentres.region@example.com";
const SERVICES_DECONCENTRES_DEPARTEMENT =
  "services.deconcentres.departement@example.com";

test.describe("Gestion des comptes utilisateurs", () => {
  test("DITP Admin — Vue admin complète et token API", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await test.step("Accès et structure du listing", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColonneVisible("Territoire");
      await pageUtilisateurs.expectBoutonCreerCompteVers(
        /\/admin\/utilisateur\/creer$/,
      );
    });

    await test.step("Vérification des profils dans le filtre", async () => {
      await pageUtilisateurs.expectProfilDansFiltre("DITP - Admin");
      await pageUtilisateurs.expectProfilDansFiltre("DITP - Pilotage");
      await pageUtilisateurs.expectProfilDansFiltre(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Secrétariat général de ministère (cormod)",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Équipe de Directeur de projet",
      );
      await pageUtilisateurs.expectProfilDansFiltre("Cabinets ministériels");
      await pageUtilisateurs.expectProfilDansFiltre(
        "Direction d'administration centrale",
      );
    });

    await test.step("Fiche détail - actions complètes", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(COORDINATEUR_REGION);
      await pageDetail.expectInfoUtilisateur(
        COORDINATEUR_REGION,
        "Region",
        "Coordinateur",
        "Coordinateur PILOTE régional",
      );
      await pageDetail.expectModifierVisible();
      await pageDetail.expectDesactiverVisible();
      await pageDetail.expectPasDeBandeau();
      await page.goBack();
    });

    await test.step("Token API - profil éligible", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(EQUIPE_DIR_PROJET);
      await pageDetail.expectTokenVisible();
      await page.goBack();
    });

    await test.step("Token API - profil non éligible", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(PREFET_REGION);
      await pageDetail.expectTokenNotVisible();
    });
  });

  test("Coordinateur Région — Visibilité et restrictions", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await test.step("Listing - structure et visibilité", async () => {
      await appActions.loginAs(COORDINATEUR_REGION);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColonneNotVisible("Territoire");
      await pageUtilisateurs.expectBoutonCreerCompteVers(/aide/);
    });

    await test.step("Listing - profils autorisés dans le filtre", async () => {
      await pageUtilisateurs.expectProfilDansFiltre(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre("DITP - Admin");
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurDansTableau(COORDINATEUR_REGION);
      await pageUtilisateurs.expectUtilisateurDansTableau(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurDansTableau(PREFET_REGION);
      await pageUtilisateurs.expectUtilisateurDansTableau(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurDansTableau(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageUtilisateurs.expectUtilisateurDansTableau(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(
        EQUIPE_DIR_PROJET,
      );
    });

    await test.step("Fiche PREFET_DEPARTEMENT - modifiable", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(PREFET_DEPARTEMENT);
      await pageDetail.expectModifierVisible();
      await pageDetail.expectDesactiverVisible();
      await pageDetail.expectPasDeBandeau();
      await pageDetail.expectTokenNotVisible();
      await page.goBack();
    });

    await test.step("Fiche SERVICES_DECONCENTRES_REGION - modifiable", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageDetail.expectModifierVisible();
      await pageDetail.expectDesactiverVisible();
      await pageDetail.expectPasDeBandeau();
      await pageDetail.expectTokenNotVisible();
      await page.goBack();
    });

    await test.step("Fiche COORDINATEUR_DEPARTEMENT - restriction coordinateur", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageDetail.expectBandeauRestriction(/coordinateur PILOTE/);
      await pageDetail.expectModifierNotVisible();
      await pageDetail.expectDesactiverNotVisible();
      await page.goBack();
    });

    // CH-108 (hors_ate_deconcentre) crée un mismatch dans les chantiers,
    // mais modificationEstImpossible ne vérifie les chantiers QUE pour le SG
    // → le coordinateur n'est PAS bloqué, l'utilisateur est modifiable
    await test.step("Fiche SERVICES_DECONCENTRES hors ATE - modifiable malgré chantier hors scope", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        "services.deconcentres.hors-ate@example.com",
      );
      await pageDetail.expectModifierVisible();
      await pageDetail.expectPasDeBandeau();
    });
  });

  test("Coordinateur Département — Périmètre restreint", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await test.step("Listing - profils restreints", async () => {
      await appActions.loginAs(COORDINATEUR_DEPARTEMENT);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColonneNotVisible("Territoire");
      await pageUtilisateurs.expectProfilDansFiltre(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre(
        "Services déconcentrés régionaux",
      );
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurDansTableau(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurDansTableau(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurDansTableau(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(
        COORDINATEUR_REGION,
      );
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(PREFET_REGION);
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(
        SERVICES_DECONCENTRES_REGION,
      );
    });

    await test.step("Fiche PREFET_DEPARTEMENT - modifiable", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(PREFET_DEPARTEMENT);
      await pageDetail.expectModifierVisible();
      await pageDetail.expectDesactiverVisible();
      await page.goBack();
    });

    await test.step("Fiche SERVICES_DECONCENTRES_DEPARTEMENT - modifiable", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageDetail.expectModifierVisible();
      await pageDetail.expectDesactiverVisible();
      await page.goBack();
    });

    await test.step("Fiche COORDINATEUR_DEPARTEMENT - restriction soi-même", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageDetail.expectBandeauRestriction(/coordinateur PILOTE/);
      await pageDetail.expectModifierNotVisible();
      await pageDetail.expectDesactiverNotVisible();
    });
  });

  test("Secrétariat Général — Par chantiers", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await test.step("Listing - profils autorisés", async () => {
      await appActions.loginAs(SECRETARIAT_GENERAL);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColonneNotVisible("Territoire");
      await pageUtilisateurs.expectBoutonCreerCompteVers(/aide/);
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilDansFiltre(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilAbsentDuFiltre("DITP - Admin");
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurDansTableau(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageUtilisateurs.expectUtilisateurDansTableau(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(PREFET_REGION);
    });

    // Les profils SD ont a_acces_tous_chantiers_territorialises → lecture.chantiers inclut
    // TOUS les chantiers territorialisés par défaut. Le SG ne couvre qu'un sous-ensemble
    // → peutAccéderAuxChantiersUtilisateurs (every) échoue → bandeau "plusieurs chantiers"
    await test.step("Fiche utilisateur - restriction chantiers", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageDetail.expectBandeauRestriction(/plusieurs chantiers/);
      await pageDetail.expectModifierNotVisible();
      await pageDetail.expectDesactiverNotVisible();
      await pageDetail.expectTokenNotVisible();
    });
  });

  test("Profils sans accès — Redirection", async ({ page }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await test.step("Préfet de région - pas d'accès", async () => {
      await appActions.loginAs(PREFET_REGION);
      await pageUtilisateurs.expectGestionDesComptesNotVisible();
      await page.goto("/admin/utilisateurs");
      await expect(page).not.toHaveURL(/\/admin\/utilisateurs/);
    });

    await test.step("Équipe direction de projet - pas d'accès", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageUtilisateurs.expectGestionDesComptesNotVisible();
      await page.goto("/admin/utilisateurs");
      await expect(page).not.toHaveURL(/\/admin\/utilisateurs/);
    });

    await test.step("Préfet de département - pas d'accès", async () => {
      await appActions.switchUser(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectGestionDesComptesNotVisible();
      await page.goto("/admin/utilisateurs");
      await expect(page).not.toHaveURL(/\/admin\/utilisateurs/);
    });
  });

  test("Désactivation et réactivation", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);
    let pageDetail: PageUtilisateurDetail;

    // On utilise SERVICES_DECONCENTRES_DEPARTEMENT comme utilisateur de test
    const utilisateurCible = SERVICES_DECONCENTRES_DEPARTEMENT;

    await test.step("Désactiver un compte", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageUtilisateurs.goto();
      pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(utilisateurCible);
      await pageDetail.expectDesactiverVisible();
      await page.getByText("Désactiver le compte").click();
      await pageDetail.confirmerDesactivation();
      await pageUtilisateurs.expectAlerte(/désactivé/);
    });

    await test.step("Vérifier le compte désactivé", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(utilisateurCible);
      await pageDetail.expectDesactive();
      await pageDetail.expectModifierNotVisible();
      await pageDetail.expectReactiverVisible();
      await page.goBack();
    });

    await test.step("Réactiver le compte", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(utilisateurCible);
      await pageDetail.expectReactiverVisible();
      await page.getByRole("button", { name: /Réactiver le compte/ }).click();
      await pageDetail.confirmerReactivation();
      await pageUtilisateurs.expectAlerte(/réactivé/);
    });

    await test.step("Vérifier le compte réactivé", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurParEmail(utilisateurCible);
      await pageDetail.expectActif();
      await pageDetail.expectModifierVisible();
    });
  });

  test("Filtres et recherche", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    await appActions.loginAs(DITP_ADMIN);
    await pageUtilisateurs.goto();

    await test.step("Filtre par statut - comptes actifs", async () => {
      await pageUtilisateurs.filtrerParStatut("actifs");
      await pageUtilisateurs.expectUtilisateurDansTableau(DITP_ADMIN);
      await pageUtilisateurs.filtrerParStatut("tous");
    });

    await test.step("Filtre par statut - comptes désactivés", async () => {
      await pageUtilisateurs.filtrerParStatut("desactives");
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(DITP_ADMIN);
      await pageUtilisateurs.filtrerParStatut("tous");
    });

    await test.step("Recherche textuelle", async () => {
      await pageUtilisateurs.rechercherUtilisateur("coordinateur");
      await pageUtilisateurs.expectUtilisateurDansTableau(COORDINATEUR_REGION);
      await pageUtilisateurs.expectUtilisateurDansTableau(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(DITP_ADMIN);
      await pageUtilisateurs.effacerRecherche();
    });

    await test.step("Filtre par profil", async () => {
      await pageUtilisateurs.filtrerParProfil(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectUtilisateurDansTableau(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurAbsentDuTableau(
        COORDINATEUR_REGION,
      );
      await page
        .getByRole("button", { name: /Réinitialiser les filtres/ })
        .click();
      await page.waitForTimeout(600);
    });

    await test.step("Réinitialisation avec filtres combinés", async () => {
      await pageUtilisateurs.filtrerParProfil("Coordinateur PILOTE régional");
      await pageUtilisateurs.rechercherUtilisateur("coordinateur");
      await page
        .getByRole("button", { name: /Réinitialiser les filtres/ })
        .click();
      await page.waitForTimeout(600);
      await pageUtilisateurs.expectUtilisateurDansTableau(DITP_ADMIN);
    });
  });

  test("Restriction multi-territoires", async ({ page }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page);
    const pageUtilisateurs = new PageAdminUtilisateurs(page);

    // prefet.multi.territoires a DEPT-56 (dans périmètre Bretagne) + DEPT-75 (hors périmètre)
    // → visible dans le listing (au moins 1 territoire en commun)
    // → mais non modifiable (DEPT-75 n'est pas couvert par le coordinateur)
    const utilisateurMultiTerritoires = "prefet.multi.territoires@example.com";

    await test.step("Coordinateur région - utilisateur visible dans le listing", async () => {
      await appActions.loginAs(COORDINATEUR_REGION);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectUtilisateurDansTableau(
        utilisateurMultiTerritoires,
      );
    });

    await test.step("Fiche - bandeau restriction multi-territoires", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurParEmail(
        utilisateurMultiTerritoires,
      );
      await pageDetail.expectBandeauRestriction(/plusieurs territoires/);
      await pageDetail.expectModifierNotVisible();
      await pageDetail.expectDesactiverNotVisible();
    });
  });
});
