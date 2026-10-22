import { expect } from "@playwright/test";
import { prisma } from "@/server/framework/persistence/prisma";
import { test } from "./fixtures";
import { readMetadataIndicateur } from "./e2e-test-context";
import {
  CHANTIER_BROUILLON,
  CHANTIER_FOR_WRITES,
  INDICATEUR_FOR_FORM,
} from "./seed/dedicated-entities";
import { AppActions } from "./actions/app.actions";
import { PageAdminIndicateurForm } from "./pages/admin/page-admin-indicateur-form";
import { PageAdminIndicateurs } from "./pages/admin/page-admin-indicateurs";

const DITP_ADMIN = "ditp.admin@example.com";

test.describe("Formulaire indicateur — Consultation et modification", () => {
  test("doit afficher la fiche indicateur en mode consultation puis permettre la modification", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);
    e2eContext.track(
      "INDICATEUR_UPDATED",
      await readMetadataIndicateur(INDICATEUR_FOR_FORM),
    );

    await step(
      `Connexion et accès à la fiche indicateur ${INDICATEUR_FOR_FORM}`,
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto(INDICATEUR_FOR_FORM);
        await pageForm.expectFicheTitle(INDICATEUR_FOR_FORM);
      },
    );

    await step("Vérification du lien retour", async () => {
      await pageForm.expectBackLinkVisible();
    });

    await step("Vérification du sélecteur Actif/Inactif", async () => {
      await pageForm.expectActiveInactiveSelectorVisible();
    });

    await step("Vérification de la carte récapitulative", async () => {
      await pageForm.expectSummaryCardVisible();
      await pageForm.expectSummaryField("Chantier associé");
      await pageForm.expectSummaryField("Nom du chantier");
      await pageForm.expectSummaryField("Identifiant indicateur");
      await pageForm.expectSummaryField("Nom de l'indicateur");
      await pageForm.expectSummaryField("Création de l'indicateur");
      await pageForm.expectSummaryField("Dernière modification");
    });

    await step("Vérification de la structure des accordéons", async () => {
      await pageForm.expectIdentityAccordionOpen();
      await pageForm.expectSettingsAccordionClosed();
      await pageForm.expectOtherInformationAccordionClosed();
    });

    await step(
      "Vérification du mode consultation (lecture seule)",
      async () => {
        await pageForm.expectReadMode();
      },
    );

    await step(
      `Vérification des données de l'indicateur ${INDICATEUR_FOR_FORM} dans la section identité`,
      async () => {
        await pageForm.expectValueDisplayed(CHANTIER_FOR_WRITES);
        await pageForm.expectValueDisplayed(INDICATEUR_FOR_FORM);
      },
    );

    await step(
      "Ouverture de l'accordéon Paramétrages et vérification des sections",
      async () => {
        await pageForm.openSettingsAccordion();
        await pageForm.expectSectionVisible("Maille départementale");
        await pageForm.expectSectionVisible("Maille régionale");
        await pageForm.expectSectionVisible("Maille nationale");
        await pageForm.expectSectionVisible(
          "Pondération de l'indicateur dans le calcul du taux d'avancement global",
        );
      },
    );

    await step("Ouverture de l'accordéon Autres informations", async () => {
      await pageForm.openOtherInformationAccordion();
    });

    await step("Passage en mode modification", async () => {
      await pageForm.clickEdit();
      await pageForm.expectEditMode();
    });

    await step(
      "Annulation des modifications — retour au mode consultation",
      async () => {
        await pageForm.clickCancel();
        await pageForm.expectReadMode();
      },
    );

    await step(
      "Passage en mode modification pour exercer chaque type de champ",
      async () => {
        await pageForm.clickEdit();
        await pageForm.expectEditMode();
      },
    );

    await step(
      "Modification d'un champ texte (Input) — indicUnite",
      async () => {
        await pageForm.fillInput("indicUnite", "kg/m²");
        await pageForm.expectInputValue("indicUnite", "kg/m²");
      },
    );

    await step("Modification d'un champ textarea — indicDescr", async () => {
      await pageForm.fillTextArea(
        "indicDescr",
        "Description modifiée pour test E2E",
      );
      await pageForm.expectTextAreaValue(
        "indicDescr",
        "Description modifiée pour test E2E",
      );
    });

    await step(
      "Modification d'un sélecteur (multi-select) — periodicite",
      async () => {
        await pageForm.openOtherInformationAccordion();
        await pageForm.changeSelect("periodicite", "Mensuelle");
        await pageForm.expectSelectValue("periodicite", "Mensuelle");
      },
    );

    await step(
      "Modification d'un interrupteur (boolean) — indicIsPhare",
      async () => {
        await pageForm.clickSwitch("Phare");
      },
    );

    await step("Soumission des modifications", async () => {
      await pageForm.clickConfirmChanges();
      await pageForm.expectUpdateSuccessAlert();
      await pageForm.expectReadMode();
    });

    await step(
      "Vérification de la persistance des valeurs modifiées après rechargement",
      async () => {
        await page.reload();
        await pageForm.expectReadMode();
        await pageForm.expectValueDisplayed("kg/m²");
        await pageForm.expectValueDisplayed(
          "Description modifiée pour test E2E",
        );
        await pageForm.expectValueDisplayed("Mensuelle");
        await pageForm.expectValueDisplayed("Oui");
      },
    );

    await step("Retour au listing depuis la fiche", async () => {
      await pageForm.clickBack();
      await expect(page).toHaveURL(/\/panel-administrateur\/indicateurs$/);
    });
  });
});

test.describe("Formulaire indicateur — Règles d'activation/désactivation des paramétrages", () => {
  test("doit activer/désactiver les champs d'agrégation selon l'origine des valeurs dans les mailles", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.openSettingsAccordion();
        await pageForm.clickEdit();
        await pageForm.expectEditMode();
      },
    );

    // IND-021 seed: vi_dept_from=user_input → vi_dept_op doit être désactivé
    await step(
      "Maille départementale — vi_dept_op désactivé quand vi_dept_from=user_input",
      async () => {
        await pageForm.expectSelectValue("viDeptFrom", "user_input");
        await pageForm.expectSelectDisabled("viDeptOp");
      },
    );

    await step(
      "Maille départementale — changer vi_dept_from en sub_indic active vi_dept_op",
      async () => {
        await pageForm.changeSelect("viDeptFrom", "sub_indic");
        await pageForm.expectSelectEnabled("viDeptOp");
      },
    );

    await step(
      "Maille départementale — remettre vi_dept_from en user_input désactive vi_dept_op",
      async () => {
        await pageForm.changeSelect("viDeptFrom", "user_input");
        await pageForm.expectSelectDisabled("viDeptOp");
      },
    );

    // IND-021 seed: va_dept_from=user_input → va_dept_op désactivé
    await step(
      "Maille départementale — va_dept_op désactivé quand va_dept_from=user_input",
      async () => {
        await pageForm.expectSelectValue("vaDeptFrom", "user_input");
        await pageForm.expectSelectDisabled("vaDeptOp");
      },
    );

    // IND-021 seed: vi_reg_from=DEPT → vi_reg_op=sum (activé)
    await step(
      "Maille régionale — vi_reg_op activé quand vi_reg_from=DEPT",
      async () => {
        await pageForm.expectSelectValue("viRegFrom", "DEPT");
        await pageForm.expectSelectEnabled("viRegOp");
        await pageForm.expectSelectValue("viRegOp", "sum");
      },
    );

    await step(
      "Maille régionale — changer vi_reg_from en user_input désactive vi_reg_op",
      async () => {
        await pageForm.changeSelect("viRegFrom", "user_input");
        await pageForm.expectSelectDisabled("viRegOp");
      },
    );

    await step(
      "Maille régionale — remettre vi_reg_from en DEPT active vi_reg_op",
      async () => {
        await pageForm.changeSelect("viRegFrom", "DEPT");
        await pageForm.expectSelectEnabled("viRegOp");
      },
    );

    // IND-021 seed: vi_nat_from=DEPT → vi_nat_op=sum (activé)
    await step(
      "Maille nationale — vi_nat_op activé quand vi_nat_from=DEPT",
      async () => {
        await pageForm.expectSelectValue("viNatFrom", "DEPT");
        await pageForm.expectSelectEnabled("viNatOp");
      },
    );

    await step(
      "Maille nationale — changer vi_nat_from en _ désactive vi_nat_op",
      async () => {
        await pageForm.changeSelect("viNatFrom", "_");
        await pageForm.expectSelectDisabled("viNatOp");
      },
    );

    // Annuler pour ne pas persister les changements
    await step("Annulation des modifications", async () => {
      await pageForm.clickCancel();
      await pageForm.expectReadMode();
    });
  });

  test("doit gérer les règles du calcul de la valeur d'avancement", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.openSettingsAccordion();
        await pageForm.clickEdit();
      },
    );

    // param_vaca_op et param_vacg_op sont toujours désactivés
    await step(
      "Opération TA annuel et TA global sont toujours désactivés",
      async () => {
        await pageForm.expectSelectDisabled("paramVacaOp");
        await pageForm.expectSelectDisabled("paramVacgOp");
      },
    );

    // IND-021 seed: param_vaca_partition_date=from_year_start → param_vaca_op=sum
    await step(
      "Valeurs initiales du calcul — partition_date=from_year_start et op=sum",
      async () => {
        await pageForm.expectSelectValue(
          "paramVacaPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelectValue("paramVacaOp", "sum");
        await pageForm.expectSelectValue(
          "paramVacgPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelectValue("paramVacgOp", "sum");
      },
    );

    // Changer partition_date en _ → op passe à current_value, et vacg se synchronise
    await step(
      "Changer partition_date TA annuel en _ → op passe à current_value et vacg se synchronise",
      async () => {
        await pageForm.changeSelect("paramVacaPartitionDate", "_");
        await pageForm.expectSelectValue("paramVacaOp", "current_value");
        await pageForm.expectSelectValue("paramVacgPartitionDate", "_");
        await pageForm.expectSelectValue("paramVacgOp", "current_value");
      },
    );

    // Remettre via vacg → doit re-synchroniser vaca
    await step(
      "Changer partition_date TA global en from_year_start → op revient à sum et vaca se synchronise",
      async () => {
        await pageForm.changeSelect(
          "paramVacgPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelectValue("paramVacgOp", "sum");
        await pageForm.expectSelectValue(
          "paramVacaPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelectValue("paramVacaOp", "sum");
      },
    );

    // Synchronisation du décumul : vaca et vacg doivent avoir la même valeur
    await step(
      "Synchronisation decumul_from — vaca et vacg ont la même valeur",
      async () => {
        const valeurVaca = await page
          .locator('[id="paramVacaDecumulFrom"]')
          .getAttribute("data-value");
        await pageForm.expectSelectValue(
          "paramVacgDecumulFrom",
          valeurVaca ?? "",
        );
      },
    );

    await step("Annulation des modifications", async () => {
      await pageForm.clickCancel();
      await pageForm.expectReadMode();
    });
  });

  test("doit désactiver les pondérations dept/reg quand l'indicateur n'est pas territorialisé", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    // IND-021 est territorialisé → poidsPourcentDept et poidsPourcentReg sont activés
    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.openSettingsAccordion();
        await pageForm.clickEdit();
      },
    );

    await step(
      "Pondération dept et reg activées quand indicateur territorialisé",
      async () => {
        await pageForm.expectInputEnabled("poidsPourcentDept");
        await pageForm.expectInputEnabled("poidsPourcentReg");
      },
    );

    // Désactiver la territorialisation via le switch dans la section identité
    await step(
      "Désactiver la territorialisation désactive les pondérations dept et reg",
      async () => {
        await pageForm.clickSwitch("Territorialisation");
        await pageForm.expectInputDisabled("poidsPourcentDept");
        await pageForm.expectInputDisabled("poidsPourcentReg");
      },
    );

    await step("Annulation des modifications", async () => {
      await pageForm.clickCancel();
      await pageForm.expectReadMode();
    });
  });
});

test.describe("Formulaire indicateur — Création", () => {
  test("doit créer un indicateur depuis le formulaire de création", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    // IND-990 n'existe pas en base, il sera initialisé comme nouvel indicateur
    const newIndicateurId = "IND-990";
    e2eContext.track("INDICATEUR_CREATED", { indicId: newIndicateurId });

    await step("Connexion et accès au formulaire de création", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageForm.gotoCreation(newIndicateurId);
      await pageForm.expectFicheTitle(newIndicateurId);
    });

    await step("Vérification du mode création", async () => {
      await pageForm.expectCreationMode();
      await pageForm.expectActiveInactiveSelectorVisible();
      await pageForm.expectIdentityAccordionOpen();
      await pageForm.expectSettingsAccordionClosed();
      await pageForm.expectOtherInformationAccordionClosed();
    });

    await step("Saisie des champs et création", async () => {
      await pageForm.fillTextArea(
        "indicNom",
        "Indicateur créé par un test e2e",
      );
      await pageForm.changeSelect("indicParentCh", CHANTIER_BROUILLON);
      await pageForm.fillTextArea(
        "indicDescr",
        "Description de l'indicateur créé par un test e2e",
      );
      await pageForm.changeSelect("indicType", "IMPACT");
      await pageForm.changeSelect("indicSchema", "sans-contraintes.json");
      await pageForm.changeSelect("periodicite", "Trimestrielle");
      await pageForm.clickCreateIndicateur();
      await pageForm.expectCreationSuccessAlert();
    });

    await step("L'indicateur créé est enregistré", async () => {
      const indicateur =
        await prisma.metadata_indicateurs_hidden.findUniqueOrThrow({
          where: { indic_id: newIndicateurId },
          select: { indic_nom: true },
        });
      expect(indicateur.indic_nom).toBe("Indicateur créé par un test e2e");
    });
  });
});

test.describe("Formulaire indicateur — Navigation depuis le listing", () => {
  test("doit naviguer du listing vers la fiche et revenir", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageIndicateurs = new PageAdminIndicateurs(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step("Connexion et accès au listing", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageIndicateurs.goto();
    });

    await step(
      "Navigation vers la fiche IND-021 depuis le listing",
      async () => {
        await pageIndicateurs.searchIndicateur("IND-021");
        await pageIndicateurs.clickIndicateurById("IND-021");
        await pageForm.expectFicheTitle("IND-021");
      },
    );

    await step("Retour au listing via le lien Retour", async () => {
      await pageForm.clickBack();
      await pageIndicateurs.expectPageTitle();
    });
  });
});

const COORDINATEUR_REGION = "coordinateur.region@example.com";
const EQUIPE_DIR_PROJET = "equipe.dir.projet@example.com";

test.describe("Formulaire indicateur — Accès refusé", () => {
  test("doit refuser l'accès à la fiche indicateur aux profils non DITP_ADMIN", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);

    await step(
      "Coordinateur région — accès direct par URL refusé",
      async () => {
        await appActions.loginAs(COORDINATEUR_REGION);
        await page.goto("/panel-administrateur/indicateurs/IND-021");
        await expect(page).not.toHaveURL(
          /\/panel-administrateur\/indicateurs\/IND-021/,
        );
      },
    );

    await step(
      "Équipe direction de projet — accès direct par URL refusé",
      async () => {
        await appActions.switchUser(EQUIPE_DIR_PROJET);
        await page.goto("/panel-administrateur/indicateurs/IND-021");
        await expect(page).not.toHaveURL(
          /\/panel-administrateur\/indicateurs\/IND-021/,
        );
      },
    );
  });
});

test.describe("Formulaire indicateur — Restriction géographique", () => {
  test("doit proposer les zone-groupes du référentiel comme valeurs sélectionnables", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step("Connexion et passage en mode modification", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageForm.goto("IND-021");
      await pageForm.clickEdit();
      await pageForm.expectEditMode();
    });

    await step(
      "Le sélecteur de zone-groupe propose ZG-001 (Groupement 1), issu du référentiel",
      async () => {
        await pageForm.expectZoneGroupeOptionVisible("Groupement 1");
      },
    );
  });
});
