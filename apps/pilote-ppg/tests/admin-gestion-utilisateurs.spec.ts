import { expect } from "@playwright/test";
import { test } from "./fixtures";
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
  test("DITP Admin — Vue admin complète et bouton de token API visible", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    await test.step("Accès et structure du listing", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColumnVisible("Territoire");
      await pageUtilisateurs.expectCreateUtilisateurButtonTo(
        /\/admin\/utilisateur\/creer$/,
      );
    });

    await test.step("Vérification des profils dans le filtre", async () => {
      await pageUtilisateurs.expectProfilInFilter("DITP - Admin");
      await pageUtilisateurs.expectProfilInFilter("DITP - Pilotage");
      await pageUtilisateurs.expectProfilInFilter(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Secrétariat général de ministère (cormod)",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Équipe de Directeur de projet",
      );
      await pageUtilisateurs.expectProfilInFilter("Cabinets ministériels");
      await pageUtilisateurs.expectProfilInFilter(
        "Direction d'administration centrale",
      );
    });

    await test.step("Fiche détail - actions complètes", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(COORDINATEUR_REGION);
      // La fiche détail affiche le code brut du profil, pas le libellé
      await pageDetail.expectUtilisateurInfo(
        COORDINATEUR_REGION,
        "Region",
        "Coordinateur",
        "COORDINATEUR_REGION",
      );
      await pageDetail.expectEditVisible();
      await pageDetail.expectDeactivateVisible();
      await pageDetail.expectNoBanner();
      await page.goBack();
    });

    await test.step("Token API - profil éligible", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(EQUIPE_DIR_PROJET);
      await pageDetail.expectTokenVisible();
      await page.goBack();
    });

    await test.step("Token API - profil non éligible", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(PREFET_REGION);
      await pageDetail.expectTokenNotVisible();
    });
  });

  test("Coordinateur Région — Visibilité et restrictions", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    await test.step("Listing - structure et visibilité", async () => {
      await appActions.loginAs(COORDINATEUR_REGION);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColumnNotVisible("Territoire");
      await pageUtilisateurs.expectCreateUtilisateurButtonTo(/aide/);
    });

    await test.step("Listing - profils autorisés dans le filtre", async () => {
      await pageUtilisateurs.expectProfilInFilter(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilNotInFilter("DITP - Admin");
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurInTable(COORDINATEUR_REGION);
      await pageUtilisateurs.expectUtilisateurInTable(COORDINATEUR_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurInTable(PREFET_REGION);
      await pageUtilisateurs.expectUtilisateurInTable(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurInTable(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageUtilisateurs.expectUtilisateurInTable(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurNotInTable(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurNotInTable(EQUIPE_DIR_PROJET);
    });

    await test.step("Fiche PREFET_DEPARTEMENT - modifiable", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(PREFET_DEPARTEMENT);
      await pageDetail.expectEditVisible();
      await pageDetail.expectDeactivateVisible();
      await pageDetail.expectNoBanner();
      await pageDetail.expectTokenNotVisible();
      await page.goBack();
    });

    await test.step("Fiche SERVICES_DECONCENTRES_REGION - modifiable", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageDetail.expectEditVisible();
      await pageDetail.expectDeactivateVisible();
      await pageDetail.expectNoBanner();
      await pageDetail.expectTokenNotVisible();
      await page.goBack();
    });

    await test.step("Fiche COORDINATEUR_DEPARTEMENT - restriction coordinateur", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageDetail.expectRestrictionBanner(/coordinateur PILOTE/);
      await pageDetail.expectEditNotVisible();
      await pageDetail.expectDeactivateNotVisible();
      await page.goBack();
    });

    // CH-108 (hors_ate_deconcentre) crée un mismatch dans les chantiers,
    // mais modificationEstImpossible ne vérifie les chantiers QUE pour le SG
    // → le coordinateur n'est PAS bloqué, l'utilisateur est modifiable
    await test.step("Fiche SERVICES_DECONCENTRES hors ATE - modifiable malgré chantier hors scope", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        "services.deconcentres.hors-ate@example.com",
      );
      await pageDetail.expectEditVisible();
      await pageDetail.expectNoBanner();
    });
  });

  test("Coordinateur Département — Périmètre restreint", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    await test.step("Listing - profils restreints", async () => {
      await appActions.loginAs(COORDINATEUR_DEPARTEMENT);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColumnNotVisible("Territoire");
      await pageUtilisateurs.expectProfilInFilter(
        "Coordinateur PILOTE départemental",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilNotInFilter(
        "Coordinateur PILOTE régional",
      );
      await pageUtilisateurs.expectProfilNotInFilter(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilNotInFilter(
        "Services déconcentrés régionaux",
      );
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurInTable(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurInTable(COORDINATEUR_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurInTable(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurNotInTable(COORDINATEUR_REGION);
      await pageUtilisateurs.expectUtilisateurNotInTable(PREFET_REGION);
      await pageUtilisateurs.expectUtilisateurNotInTable(
        SERVICES_DECONCENTRES_REGION,
      );
    });

    await test.step("Fiche PREFET_DEPARTEMENT - modifiable", async () => {
      const pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(PREFET_DEPARTEMENT);
      await pageDetail.expectEditVisible();
      await pageDetail.expectDeactivateVisible();
      await page.goBack();
    });

    await test.step("Fiche SERVICES_DECONCENTRES_DEPARTEMENT - modifiable", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageDetail.expectEditVisible();
      await pageDetail.expectDeactivateVisible();
      await page.goBack();
    });

    await test.step("Fiche COORDINATEUR_DEPARTEMENT - restriction soi-même", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        COORDINATEUR_DEPARTEMENT,
      );
      await pageDetail.expectRestrictionBanner(/coordinateur PILOTE/);
      await pageDetail.expectEditNotVisible();
      await pageDetail.expectDeactivateNotVisible();
    });
  });

  test("Secrétariat Général — Par chantiers", async ({ page, e2eContext }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    await test.step("Listing - profils autorisés", async () => {
      await appActions.loginAs(SECRETARIAT_GENERAL);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectColumnNotVisible("Territoire");
      await pageUtilisateurs.expectCreateUtilisateurButtonTo(/aide/);
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés régionaux",
      );
      await pageUtilisateurs.expectProfilInFilter(
        "Services déconcentrés départementaux",
      );
      await pageUtilisateurs.expectProfilNotInFilter(
        "Préfet de région et collaborateurs",
      );
      await pageUtilisateurs.expectProfilNotInFilter("DITP - Admin");
    });

    await test.step("Listing - utilisateurs visibles", async () => {
      await pageUtilisateurs.expectUtilisateurInTable(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageUtilisateurs.expectUtilisateurInTable(
        SERVICES_DECONCENTRES_DEPARTEMENT,
      );
      await pageUtilisateurs.expectUtilisateurNotInTable(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurNotInTable(PREFET_REGION);
    });

    // Les profils SD ont a_acces_tous_chantiers_territorialises → lecture.chantiers inclut
    // TOUS les chantiers territorialisés par défaut. Le SG ne couvre qu'un sous-ensemble
    // → peutAccéderAuxChantiersUtilisateurs (every) échoue → bandeau "plusieurs chantiers"
    await test.step("Fiche utilisateur - restriction chantiers", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        SERVICES_DECONCENTRES_REGION,
      );
      await pageDetail.expectRestrictionBanner(/plusieurs chantiers/);
      await pageDetail.expectEditNotVisible();
      await pageDetail.expectDeactivateNotVisible();
      await pageDetail.expectTokenNotVisible();
    });
  });

  test("Profils sans accès — Redirection", async ({ page, e2eContext }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

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

  test("Désactivation et réactivation", async ({ page, e2eContext }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);
    let pageDetail: PageUtilisateurDetail;

    // On utilise SERVICES_DECONCENTRES_DEPARTEMENT comme utilisateur de test
    const utilisateurCible = SERVICES_DECONCENTRES_DEPARTEMENT;

    await test.step("Désactiver un compte", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageUtilisateurs.goto();
      pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(utilisateurCible);
      await pageDetail.expectDeactivateVisible();
      await page.getByText("Désactiver le compte").click();
      await pageDetail.confirmDeactivation(utilisateurCible);
      await pageUtilisateurs.expectAlert(/désactivé/);
    });

    await test.step("Vérifier le compte désactivé", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(utilisateurCible);
      await pageDetail.expectDeactivated();
      await pageDetail.expectEditNotVisible();
      await pageDetail.expectReactivateVisible();
      await page.goBack();
    });

    await test.step("Réactiver le compte", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(utilisateurCible);
      await pageDetail.expectReactivateVisible();
      await page.getByRole("button", { name: /Réactiver le compte/ }).click();
      await pageDetail.confirmReactivation();
      await pageUtilisateurs.expectAlert(/réactivé/);
    });

    await test.step("Vérifier le compte réactivé", async () => {
      pageDetail =
        await pageUtilisateurs.clickUtilisateurByEmail(utilisateurCible);
      await pageDetail.expectActive();
      await pageDetail.expectEditVisible();
    });
  });

  test("Filtres et recherche", async ({ page, e2eContext }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    await appActions.loginAs(DITP_ADMIN);
    await pageUtilisateurs.goto();

    await test.step("Filtre par statut - comptes actifs", async () => {
      await pageUtilisateurs.filterByStatut("actifs");
      await pageUtilisateurs.expectUtilisateurInTable(DITP_ADMIN);
      await pageUtilisateurs.filterByStatut("tous");
    });

    await test.step("Filtre par statut - comptes désactivés", async () => {
      await pageUtilisateurs.filterByStatut("desactives");
      await pageUtilisateurs.expectUtilisateurNotInTable(DITP_ADMIN);
      await pageUtilisateurs.filterByStatut("tous");
    });

    await test.step("Recherche textuelle", async () => {
      await pageUtilisateurs.searchUtilisateur("coordinateur");
      await pageUtilisateurs.expectUtilisateurInTable(COORDINATEUR_REGION);
      await pageUtilisateurs.expectUtilisateurInTable(COORDINATEUR_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurNotInTable(DITP_ADMIN);
      await pageUtilisateurs.clearSearch();
    });

    await test.step("Filtre par profil", async () => {
      await pageUtilisateurs.filterByProfil(
        "Préfet de département et collaborateurs",
      );
      await pageUtilisateurs.expectUtilisateurInTable(PREFET_DEPARTEMENT);
      await pageUtilisateurs.expectUtilisateurNotInTable(DITP_ADMIN);
      await pageUtilisateurs.expectUtilisateurNotInTable(COORDINATEUR_REGION);
      await page
        .getByRole("button", { name: /Réinitialiser les filtres/ })
        .click();
      // Condition observable plutot qu'un delai fixe : les utilisateurs masques par
      // le filtre doivent etre revenus. Ca verifie aussi la reinitialisation, qui
      // n'etait jusqu'ici pas assertee du tout.
      await pageUtilisateurs.expectUtilisateurInTable(DITP_ADMIN);
    });

    await test.step("Réinitialisation avec filtres combinés", async () => {
      await pageUtilisateurs.filterByProfil("Coordinateur PILOTE régional");
      await pageUtilisateurs.searchUtilisateur("coordinateur");
      await page
        .getByRole("button", { name: /Réinitialiser les filtres/ })
        .click();
      // Le bouton "Réinitialiser" ne clear que la barre latérale, pas la recherche
      await pageUtilisateurs.clearSearch();
      await pageUtilisateurs.expectUtilisateurInTable(DITP_ADMIN);
    });
  });

  test("Restriction multi-territoires", async ({ page, e2eContext }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageUtilisateurs = new PageAdminUtilisateurs(page, e2eContext);

    // prefet.multi.territoires a DEPT-56 (dans périmètre Bretagne) + DEPT-75 (hors périmètre)
    // → visible dans le listing (au moins 1 territoire en commun)
    // → mais non modifiable (DEPT-75 n'est pas couvert par le coordinateur)
    const utilisateurMultiTerritoires = "prefet.multi.territoires@example.com";

    await test.step("Coordinateur région - utilisateur visible dans le listing", async () => {
      await appActions.loginAs(COORDINATEUR_REGION);
      await pageUtilisateurs.goto();
      await pageUtilisateurs.expectUtilisateurInTable(
        utilisateurMultiTerritoires,
      );
    });

    await test.step("Fiche - bandeau restriction multi-territoires", async () => {
      const pageDetail = await pageUtilisateurs.clickUtilisateurByEmail(
        utilisateurMultiTerritoires,
      );
      await pageDetail.expectRestrictionBanner(/plusieurs territoires/);
      await pageDetail.expectEditNotVisible();
      await pageDetail.expectDeactivateNotVisible();
    });
  });
});
