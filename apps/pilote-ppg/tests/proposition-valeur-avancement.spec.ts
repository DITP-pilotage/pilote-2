import { test } from "./fixtures";
import { AppActions } from "./actions/app.actions";
import { PageChantier } from "./pages/page-chantier";

const CHANTIER_ID = "129";
const TERRITOIRE_DEPT = "DEPT-56";
const TERRITOIRE_REG = "REG-53";

const COORDINATEUR_DEPT = "pva.coordinateur.dept@example.com";
const PREFET_DEPT = "pva.prefet.dept@example.com";
const COORDINATEUR_REG = "pva.coordinateur.reg@example.com";
const EQUIPE_DIR_PROJET = "pva.dir.projet@example.com";

// Chaque test travaille sur son propre indicateur (IND-021 à IND-024) : ils
// peuvent tourner en parallèle.
test.describe.configure({ mode: "parallel" });

test.describe("Proposition de valeur d'avancement (PVA)", () => {
  test("Coordinateur département propose, Direction accuse réception puis accepte", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-021";

    await test.step("Territoire crée une proposition", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposeAnotherValeur();

      await modal.expectContains("Proposer une valeur d'avancement");
      await modal.fillProposition(
        "42.5",
        "Motif test e2e proposition initiale",
        "Source test e2e et methode de calcul",
      );
      await modal.goToNextStep();

      await modal.expectContains("42.5");
      await modal.expectContains("Motif test e2e proposition initiale");

      await modal.publishProposition();
      await modal.expectConfirmationAndClose(
        /correctement été prise en compte/,
      );
    });

    await test.step("Vérification du statut côté territoire après création", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(
        /Proposition de nouvelle valeur d'avancement en cours/,
      );
      await indicateur.expectStatut(
        /en attente de lecture par la direction de projet/,
      );

      await indicateur.showProposition();
      await indicateur.expectEditVisible();
      await indicateur.expectDeleteVisible();
    });

    await test.step("Direction accuse réception de la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(
        /Proposition de nouvelle valeur d'avancement en cours/,
      );

      await indicateur.showProposition();
      const modal = await indicateur.clickAccuseReception();

      await modal.expectHeading("Accuser réception");
      await modal.fillMotif("Information complementaire pour le territoire");
      await modal.goToNextStep();

      await modal.expectContains(
        "Information complementaire pour le territoire",
      );

      await modal.confirmAccuseReception();
      await modal.expectConfirmationAndClose(/a bien été enregistré/);
    });

    await test.step("Vérification côté territoire : boutons de modification absents après accusé réception", async () => {
      await appActions.switchUser(COORDINATEUR_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/lue par la direction de projet/);

      await indicateur.showProposition();
      await indicateur.expectEditNotVisible();
      await indicateur.expectDeleteNotVisible();
    });

    await test.step("Direction accepte la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.showProposition();
      const modal = await indicateur.clickMakeDecision();

      await modal.expectHeading("Prendre une décision");
      await modal.selectDecision("accepter");
      await modal.fillMotif("Acceptation validee");
      await modal.goToNextStep();

      await modal.expectContains(/la proposition est acceptée/);

      await modal.acceptProposition();
      await modal.expectConfirmationAndClose(/a bien été acceptée/);
    });

    await test.step("Vérification du statut accepté côté direction", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(
        /Proposition de nouvelle valeur d'avancement/,
      );
      await indicateur.expectStatut(/acceptée/);
    });

    await test.step("Vérification de l'historique des propositions", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickShowHistorique();

      await modal.expectContains(
        "Historique des actions sur les valeurs d'avancement",
      );
      await modal.expectContains(indicId);
      await modal.expectContains(/nouvelle proposition/);
      await modal.expectContains(/accusé de réception de la proposition/);
      await modal.expectContains(/acceptée.*par la direction de projet/);

      await modal.close();
    });
  });

  test("Préfet département propose, Direction refuse, Territoire peut re-proposer", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-022";

    await test.step("Territoire crée une proposition", async () => {
      await appActions.loginAs(PREFET_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposeAnotherValeur();

      await modal.fillProposition(
        "85",
        "Motif test e2e par prefet departement",
        "Source prefet departement",
      );
      await modal.goToNextStep();
      await modal.publishProposition();
      await modal.expectConfirmationAndClose(
        /correctement été prise en compte/,
      );
    });

    await test.step("Direction refuse la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.showProposition();
      const modal = await indicateur.clickMakeDecision();

      await modal.selectDecision("refuser");
      await modal.fillMotif("Motif de refus test e2e");
      await modal.goToNextStep();

      await modal.expectContains(/la proposition est refusée/);

      await modal.validateDecision();
      await modal.expectConfirmationAndClose(/a bien été refusée/);
    });

    await test.step("Vérification côté direction : proposition refusée", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/dernière proposition en date refusée/);
    });

    await test.step("Vérification côté territoire : peut proposer à nouveau", async () => {
      await appActions.switchUser(PREFET_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/dernière proposition en date refusée/);
      await indicateur.expectProposeAnotherValeurVisible();
    });

    await test.step("Vérification de l'historique", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickShowHistorique();

      await modal.expectContains(/nouvelle proposition/);
      await modal.expectContains(/refusée.*par la direction de projet/);

      await modal.close();
    });
  });

  test("Territoire propose, Direction accepte avec modification de valeur", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-023";

    await test.step("Territoire crée une proposition avec valeur 75", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposeAnotherValeur();

      await modal.fillProposition(
        "75",
        "Motif proposition valeur 75",
        "Source donnees test",
      );
      await modal.goToNextStep();
      await modal.publishProposition();
      await modal.expectConfirmationAndClose(
        /correctement été prise en compte/,
      );
    });

    await test.step("Direction accepte avec modification (valeur 60)", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.showProposition();
      const modal = await indicateur.clickMakeDecision();

      await modal.selectDecision("accepter-avec-modification");
      await modal.fillUpdatedValeur("60");
      await modal.fillMotif("Valeur ajustee a 60 selon nos donnees");
      await modal.goToNextStep();

      await modal.expectContains(/la proposition est modifiée/);
      await modal.expectContains(/60 \(/);

      await modal.acceptWithModification();
      await modal.expectConfirmationAndClose(
        /a bien été acceptée avec modification/,
      );
    });

    await test.step("Vérification du statut acceptée avec modification", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/acceptée avec modification/);
    });

    await test.step("Vérification de l'historique", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickShowHistorique();

      await modal.expectContains(/nouvelle proposition/);
      await modal.expectContains(/acceptée avec modification/);

      await modal.close();
    });
  });

  test("Territoire modifie puis supprime sa proposition", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-024";

    await test.step("Territoire crée une proposition avec valeur 30", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposeAnotherValeur();

      await modal.fillProposition(
        "30",
        "Motif proposition initiale a modifier",
        "Source initiale",
      );
      await modal.goToNextStep();
      await modal.publishProposition();
      await modal.expectConfirmationAndClose(
        /correctement été prise en compte/,
      );
    });

    await test.step("Territoire modifie la proposition (valeur 35)", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(
        /Proposition de nouvelle valeur d'avancement en cours/,
      );

      await indicateur.showProposition();
      const modal = await indicateur.clickEditProposition();

      await modal.expectContains("Proposer une valeur d'avancement");
      await modal.fillProposition(
        "35",
        "Motif modifie valeur corrigee a 35",
        "Source corrigee",
      );
      await modal.goToNextStep();

      await modal.expectContains(/Valeur d'avancement proposée/);

      await modal.publishProposition();
      await modal.expectConfirmationAndClose(
        /correctement été prise en compte/,
      );
    });

    await test.step("Vérification du statut modifié", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(
        /Proposition de nouvelle valeur d'avancement en cours/,
      );
      await indicateur.expectStatut(/modifiée par le territoire/);
    });

    await test.step("Territoire supprime la proposition", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.showProposition();
      const modal = await indicateur.clickDeleteProposition();

      await modal.expectHeading("Supprimer la proposition");
      await modal.fillDeletionMotif("Suppression car proposition erronee");
      await modal.goToNextStep();

      await modal.expectContains("Suppression car proposition erronee");

      await modal.confirmDeletion();
      await modal.expectConfirmationAndClose(/correctement été supprimée/);
    });

    await test.step("Vérification : proposition supprimée et possibilité de re-proposer", async () => {
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/dernière proposition en date supprimée/);
      await indicateur.expectProposeAnotherValeurVisible();
    });

    await test.step("Vérification de l'historique complet", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickShowHistorique();

      await modal.expectContains(/nouvelle proposition/);
      await modal.expectContains(/modification de la proposition/);
      await modal.expectContains(/suppression de la proposition/);

      await modal.close();
    });
  });

  test("Maille région agrégée - blocage de la proposition", async ({
    page,
    e2eContext,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-021";

    await test.step("Coordinateur région navigue vers le chantier au niveau régional", async () => {
      await appActions.loginAs(COORDINATEUR_REG);
      await pageChantier.selectChantierWithTerritoire(
        CHANTIER_ID,
        TERRITOIRE_REG,
      );
      await pageChantier.expandAutresIndicateurs();
    });

    await test.step("Vérification du message de blocage sur indicateur agrégé", async () => {
      const indicateur = pageChantier.getIndicateurPva(indicId, TERRITOIRE_REG);
      await indicateur.expectMailleBlocked();
      await indicateur.expectProposeAnotherValeurNotVisible();
    });
  });
});
