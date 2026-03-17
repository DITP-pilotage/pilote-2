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

test.describe("Proposition de valeur d'avancement (PVA)", () => {
  test("Coordinateur département propose, Direction accuse réception puis accepte", async ({
    page,
    e2eContext,
  }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-021";

    await test.step("Territoire crée une proposition", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposerAutreValeur();

      await modal.expectContient("Proposer une valeur d'avancement");
      await modal.remplirProposition(
        "42.5",
        "Motif test e2e proposition initiale",
        "Source test e2e et methode de calcul",
      );
      await modal.passerEtapeSuivante();

      await modal.expectContient("42.5");
      await modal.expectContient("Motif test e2e proposition initiale");

      await modal.publierProposition();
      await modal.expectConfirmationEtFermer(
        /correctement été prise en compte/,
      );
    });

    await test.step("Vérification du statut côté territoire après création", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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

      await indicateur.afficherProposition();
      await indicateur.expectModifierVisible();
      await indicateur.expectSupprimerVisible();
    });

    await test.step("Direction accuse réception de la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierAvecTerritoire(
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

      await indicateur.afficherProposition();
      const modal = await indicateur.clickAccuserReception();

      await modal.expectHeading("Accuser réception");
      await modal.remplirMotif("Information complementaire pour le territoire");
      await modal.passerEtapeSuivante();

      await modal.expectContient(
        "Information complementaire pour le territoire",
      );

      await modal.confirmerAccuseReception();
      await modal.expectConfirmationEtFermer(/a bien été enregistré/);
    });

    await test.step("Vérification côté territoire : boutons désactivés après accusé réception", async () => {
      await appActions.switchUser(COORDINATEUR_DEPT);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/lue par la direction de projet/);

      await indicateur.afficherProposition();
      await indicateur.expectModifierNotVisible();
      await indicateur.expectSupprimerNotVisible();
    });

    await test.step("Direction accepte la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.afficherProposition();
      const modal = await indicateur.clickPrendreDecision();

      await modal.expectHeading("Prendre une décision");
      await modal.selectionnerDecision("accepter");
      await modal.remplirMotif("Acceptation validee");
      await modal.passerEtapeSuivante();

      await modal.expectContient(/la proposition est acceptée/);

      await modal.accepterProposition();
      await modal.expectConfirmationEtFermer(/a bien été acceptée/);
    });

    await test.step("Vérification du statut accepté côté direction", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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
      const modal = await indicateur.clickVoirHistorique();

      await modal.expectContient(
        "Historique des actions sur les valeurs d'avancement",
      );
      await modal.expectContient(indicId);
      await modal.expectContient(/nouvelle proposition/);
      await modal.expectContient(/accusé de réception de la proposition/);
      await modal.expectContient(/acceptée.*par la direction de projet/);

      await modal.fermer();
    });
  });

  test("Préfet département propose, Direction refuse, Territoire peut re-proposer", async ({
    page,
    e2eContext,
  }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-022";

    await test.step("Territoire crée une proposition", async () => {
      await appActions.loginAs(PREFET_DEPT);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposerAutreValeur();

      await modal.remplirProposition(
        "85",
        "Motif test e2e par prefet departement",
        "Source prefet departement",
      );
      await modal.passerEtapeSuivante();
      await modal.publierProposition();
      await modal.expectConfirmationEtFermer(
        /correctement été prise en compte/,
      );
    });

    await test.step("Direction refuse la proposition", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.afficherProposition();
      const modal = await indicateur.clickPrendreDecision();

      await modal.selectionnerDecision("refuser");
      await modal.remplirMotif("Motif de refus test e2e");
      await modal.passerEtapeSuivante();

      await modal.expectContient(/la proposition est refusée/);

      await modal.validerDecision();
      await modal.expectConfirmationEtFermer(/a bien été refusée/);
    });

    await test.step("Vérification côté direction : proposition refusée", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/dernière proposition en date refusée/);
      await indicateur.expectProposerAutreValeurVisible();
    });

    await test.step("Vérification de l'historique", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickVoirHistorique();

      await modal.expectContient(/nouvelle proposition/);
      await modal.expectContient(/refusée.*par la direction de projet/);

      await modal.fermer();
    });
  });

  test("Territoire propose, Direction accepte avec modification de valeur", async ({
    page,
    e2eContext,
  }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-023";

    await test.step("Territoire crée une proposition avec valeur 75", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposerAutreValeur();

      await modal.remplirProposition(
        "75",
        "Motif proposition valeur 75",
        "Source donnees test",
      );
      await modal.passerEtapeSuivante();
      await modal.publierProposition();
      await modal.expectConfirmationEtFermer(
        /correctement été prise en compte/,
      );
    });

    await test.step("Direction accepte avec modification (valeur 60)", async () => {
      await appActions.switchUser(EQUIPE_DIR_PROJET);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.afficherProposition();
      const modal = await indicateur.clickPrendreDecision();

      await modal.selectionnerDecision("accepter-avec-modification");
      await modal.remplirValeurModification("60");
      await modal.remplirMotif("Valeur ajustee a 60 selon nos donnees");
      await modal.passerEtapeSuivante();

      await modal.expectContient(/la proposition est modifiée/);
      await modal.expectContient("60 ()");

      await modal.accepterAvecModification();
      await modal.expectConfirmationEtFermer(
        /a bien été acceptée avec modification/,
      );
    });

    await test.step("Vérification du statut acceptée avec modification", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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
      const modal = await indicateur.clickVoirHistorique();

      await modal.expectContient(/nouvelle proposition/);
      await modal.expectContient(/acceptée avec modification/);

      await modal.fermer();
    });
  });

  test("Territoire modifie puis supprime sa proposition", async ({
    page,
    e2eContext,
  }) => {
    test.setTimeout(300_000);

    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-024";

    await test.step("Territoire crée une proposition avec valeur 30", async () => {
      await appActions.loginAs(COORDINATEUR_DEPT);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickProposerAutreValeur();

      await modal.remplirProposition(
        "30",
        "Motif proposition initiale a modifier",
        "Source initiale",
      );
      await modal.passerEtapeSuivante();
      await modal.publierProposition();
      await modal.expectConfirmationEtFermer(
        /correctement été prise en compte/,
      );
    });

    await test.step("Territoire modifie la proposition (valeur 35)", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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

      await indicateur.afficherProposition();
      const modal = await indicateur.clickModifierProposition();

      await modal.expectContient("Proposer une valeur d'avancement");
      await modal.remplirProposition(
        "35",
        "Motif modifie valeur corrigee a 35",
        "Source corrigee",
      );
      await modal.passerEtapeSuivante();

      await modal.expectContient(/Valeur d'avancement proposée/);

      await modal.publierProposition();
      await modal.expectConfirmationEtFermer(
        /correctement été prise en compte/,
      );
    });

    await test.step("Vérification du statut modifié", async () => {
      await pageChantier.selectChantierAvecTerritoire(
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
      await indicateur.afficherProposition();
      const modal = await indicateur.clickSupprimerProposition();

      await modal.expectHeading("Supprimer la proposition");
      await modal.remplirMotifSuppression(
        "Suppression car proposition erronee",
      );
      await modal.passerEtapeSuivante();

      await modal.expectContient("Suppression car proposition erronee");

      await modal.confirmerSuppression();
      await modal.expectConfirmationEtFermer(/correctement été supprimée/);
    });

    await test.step("Vérification : proposition supprimée et possibilité de re-proposer", async () => {
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_DEPT,
      );
      await pageChantier.expandAutresIndicateurs();

      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      await indicateur.expectStatut(/dernière proposition en date supprimée/);
      await indicateur.expectProposerAutreValeurVisible();
    });

    await test.step("Vérification de l'historique complet", async () => {
      const indicateur = pageChantier.getIndicateurPva(
        indicId,
        TERRITOIRE_DEPT,
      );
      const modal = await indicateur.clickVoirHistorique();

      await modal.expectContient(/nouvelle proposition/);
      await modal.expectContient(/modification de la proposition/);
      await modal.expectContient(/suppression de la proposition/);

      await modal.fermer();
    });
  });

  test("Maille région agrégée - blocage de la proposition", async ({
    page,
    e2eContext,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageChantier = new PageChantier(page, e2eContext);
    const indicId = "IND-021";

    await test.step("Coordinateur région navigue vers le chantier au niveau régional", async () => {
      await appActions.loginAs(COORDINATEUR_REG);
      await pageChantier.selectChantierAvecTerritoire(
        CHANTIER_ID,
        TERRITOIRE_REG,
      );
      await pageChantier.expandAutresIndicateurs();
    });

    await test.step("Vérification du message de blocage sur indicateur agrégé", async () => {
      const indicateur = pageChantier.getIndicateurPva(indicId, TERRITOIRE_REG);
      await indicateur.expectBlocageMaille();
      await indicateur.expectProposerAutreValeurNotVisible();
    });
  });
});
