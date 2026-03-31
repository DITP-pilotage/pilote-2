import { expect } from "@playwright/test";
import { test } from "./fixtures";
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
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step("Connexion et accès à la fiche indicateur IND-021", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageForm.goto("IND-021");
      await pageForm.expectTitreFiche("IND-021");
    });

    await step("Vérification du lien retour", async () => {
      await pageForm.expectLienRetourVisible();
    });

    await step("Vérification du sélecteur Actif/Inactif", async () => {
      await pageForm.expectSelecteurActifInactifVisible();
    });

    await step("Vérification de la carte récapitulative", async () => {
      await pageForm.expectCarteRecapitulativeVisible();
      await pageForm.expectChampRecapitulatif("Chantier associé");
      await pageForm.expectChampRecapitulatif("Nom du chantier");
      await pageForm.expectChampRecapitulatif("Identifiant indicateur");
      await pageForm.expectChampRecapitulatif("Nom de l'indicateur");
      await pageForm.expectChampRecapitulatif("Création de l'indicateur");
      await pageForm.expectChampRecapitulatif("Dernière modification");
    });

    await step("Vérification de la structure des accordéons", async () => {
      await pageForm.expectAccordionIdentiteOuvert();
      await pageForm.expectAccordionParametragesFerme();
      await pageForm.expectAccordionAutresInformationsFerme();
    });

    await step(
      "Vérification du mode consultation (lecture seule)",
      async () => {
        await pageForm.expectModeConsultation();
      },
    );

    await step(
      "Vérification des données de l'indicateur IND-021 dans la section identité",
      async () => {
        await pageForm.expectDonneeAffichee("CH-129");
        await pageForm.expectDonneeAffichee("IND-021");
      },
    );

    await step(
      "Ouverture de l'accordéon Paramétrages et vérification des sections",
      async () => {
        await pageForm.ouvrirAccordionParametrages();
        await pageForm.expectSectionVisible("Maille départementale");
        await pageForm.expectSectionVisible("Maille régionale");
        await pageForm.expectSectionVisible("Maille nationale");
        await pageForm.expectSectionVisible(
          "Pondération de l'indicateur dans le calcul du taux d'avancement global",
        );
      },
    );

    await step("Ouverture de l'accordéon Autres informations", async () => {
      await pageForm.ouvrirAccordionAutresInformations();
    });

    await step("Passage en mode modification", async () => {
      await pageForm.clickModifier();
      await pageForm.expectModeModification();
    });

    await step(
      "Annulation des modifications — retour au mode consultation",
      async () => {
        await pageForm.clickAnnuler();
        await pageForm.expectModeConsultation();
      },
    );

    await step(
      "Passage en mode modification pour exercer chaque type de champ",
      async () => {
        await pageForm.clickModifier();
        await pageForm.expectModeModification();
      },
    );

    await step(
      "Modification d'un champ texte (Input) — indicUnite",
      async () => {
        await pageForm.remplirInput("indicUnite", "kg/m²");
        await pageForm.expectInputValeur("indicUnite", "kg/m²");
      },
    );

    await step("Modification d'un champ textarea — indicDescr", async () => {
      await pageForm.remplirTextArea(
        "indicDescr",
        "Description modifiée pour test E2E",
      );
      await pageForm.expectTextAreaValeur(
        "indicDescr",
        "Description modifiée pour test E2E",
      );
    });

    await step(
      "Modification d'un sélecteur (multi-select) — periodicite",
      async () => {
        await pageForm.ouvrirAccordionAutresInformations();
        await pageForm.changerSelecteur("periodicite", "Mensuelle");
        await pageForm.expectSelecteurValeur("periodicite", "Mensuelle");
      },
    );

    await step(
      "Modification d'un interrupteur (boolean) — indicIsPhare",
      async () => {
        await pageForm.clickSwitch("Phare");
      },
    );

    await step("Soumission des modifications", async () => {
      await pageForm.clickConfirmerChangements();
      await pageForm.expectAlerteSuccesModification();
      await pageForm.expectModeConsultation();
    });

    await step(
      "Vérification de la persistance des valeurs modifiées après soumission",
      async () => {
        await pageForm.expectDonneeAffichee("kg/m²");
        await pageForm.expectDonneeAffichee(
          "Description modifiée pour test E2E",
        );
        await pageForm.expectDonneeAffichee("Mensuelle");
        await pageForm.expectDonneeAffichee("Oui");
      },
    );

    await step("Restauration des valeurs d'origine et soumission", async () => {
      await pageForm.clickModifier();
      await pageForm.remplirInput("indicUnite", "");
      await pageForm.remplirTextArea(
        "indicDescr",
        "Contrôles « terrain » réalisés au titre des plans de surveillance et de contrôle de l'environnement marin (PSCEM) et des plans interrégionaux des contrôles des pêches (PIRC) pour la pêche à pied loisir et professionnelle ainsi que pour la pêche de loisir embarquée et sous-marine. // Thématiques de contrôle : mouillage individuel ; zone de mouillage et d'équipement léger (ZMEL) ; rejet ; espèces protégées et leurs habitats (faune et flore) ; biens culturels maritimes ; épaves ; activités et manifestations soumises à évaluation d'incidence Natura 2000 ; domanialité publique (circulation et dégradation) ; culture marine ; travaux en milieu marin ; arrêtés à visa environnemental ; arrêté de protection ; réserve naturelle ; parc national ; pêche à pied, pêche de loisir embarqué et sous-marine, etc. // Corps de contrôle : DDT/(A)M / DGTM, Parcs Naturels Marins, Gendarmerie Nationale, Réserves Naturelles, Douane, Gendarmerie Maritime, Parcs Nationaux, Office Français de la Biodiversité, DIRM/DM, DMLC, Conservatoire du littoral, Marine Nationale, Police Municipale, DREAL/DEAL/DRIEAT/DEALM, Police Nationale, autres.",
      );
      await pageForm.ouvrirAccordionAutresInformations();
      await pageForm.changerSelecteur("periodicite", "Trimestrielle");
      await pageForm.clickSwitch("Phare");
      await pageForm.clickConfirmerChangements();
      await pageForm.expectAlerteSuccesModification();
      await pageForm.expectModeConsultation();
    });

    await step("Retour au listing depuis la fiche", async () => {
      await pageForm.clickRetour();
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
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.ouvrirAccordionParametrages();
        await pageForm.clickModifier();
        await pageForm.expectModeModification();
      },
    );

    // IND-021 seed: vi_dept_from=user_input → vi_dept_op doit être désactivé
    await step(
      "Maille départementale — vi_dept_op désactivé quand vi_dept_from=user_input",
      async () => {
        await pageForm.expectSelecteurValeur("viDeptFrom", "user_input");
        await pageForm.expectSelecteurDesactive("viDeptOp");
      },
    );

    await step(
      "Maille départementale — changer vi_dept_from en sub_indic active vi_dept_op",
      async () => {
        await pageForm.changerSelecteur("viDeptFrom", "sub_indic");
        await pageForm.expectSelecteurActive("viDeptOp");
      },
    );

    await step(
      "Maille départementale — remettre vi_dept_from en user_input désactive vi_dept_op",
      async () => {
        await pageForm.changerSelecteur("viDeptFrom", "user_input");
        await pageForm.expectSelecteurDesactive("viDeptOp");
      },
    );

    // IND-021 seed: va_dept_from=user_input → va_dept_op désactivé
    await step(
      "Maille départementale — va_dept_op désactivé quand va_dept_from=user_input",
      async () => {
        await pageForm.expectSelecteurValeur("vaDeptFrom", "user_input");
        await pageForm.expectSelecteurDesactive("vaDeptOp");
      },
    );

    // IND-021 seed: vi_reg_from=DEPT → vi_reg_op=sum (activé)
    await step(
      "Maille régionale — vi_reg_op activé quand vi_reg_from=DEPT",
      async () => {
        await pageForm.expectSelecteurValeur("viRegFrom", "DEPT");
        await pageForm.expectSelecteurActive("viRegOp");
        await pageForm.expectSelecteurValeur("viRegOp", "sum");
      },
    );

    await step(
      "Maille régionale — changer vi_reg_from en user_input désactive vi_reg_op",
      async () => {
        await pageForm.changerSelecteur("viRegFrom", "user_input");
        await pageForm.expectSelecteurDesactive("viRegOp");
      },
    );

    await step(
      "Maille régionale — remettre vi_reg_from en DEPT active vi_reg_op",
      async () => {
        await pageForm.changerSelecteur("viRegFrom", "DEPT");
        await pageForm.expectSelecteurActive("viRegOp");
      },
    );

    // IND-021 seed: vi_nat_from=DEPT → vi_nat_op=sum (activé)
    await step(
      "Maille nationale — vi_nat_op activé quand vi_nat_from=DEPT",
      async () => {
        await pageForm.expectSelecteurValeur("viNatFrom", "DEPT");
        await pageForm.expectSelecteurActive("viNatOp");
      },
    );

    await step(
      "Maille nationale — changer vi_nat_from en _ désactive vi_nat_op",
      async () => {
        await pageForm.changerSelecteur("viNatFrom", "_");
        await pageForm.expectSelecteurDesactive("viNatOp");
      },
    );

    // Annuler pour ne pas persister les changements
    await step("Annulation des modifications", async () => {
      await pageForm.clickAnnuler();
      await pageForm.expectModeConsultation();
    });
  });

  test("doit gérer les règles du calcul de la valeur d'avancement", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.ouvrirAccordionParametrages();
        await pageForm.clickModifier();
      },
    );

    // param_vaca_op et param_vacg_op sont toujours désactivés
    await step(
      "Opération TA annuel et TA global sont toujours désactivés",
      async () => {
        await pageForm.expectSelecteurDesactive("paramVacaOp");
        await pageForm.expectSelecteurDesactive("paramVacgOp");
      },
    );

    // IND-021 seed: param_vaca_partition_date=from_year_start → param_vaca_op=sum
    await step(
      "Valeurs initiales du calcul — partition_date=from_year_start et op=sum",
      async () => {
        await pageForm.expectSelecteurValeur(
          "paramVacaPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelecteurValeur("paramVacaOp", "sum");
        await pageForm.expectSelecteurValeur(
          "paramVacgPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelecteurValeur("paramVacgOp", "sum");
      },
    );

    // Changer partition_date en _ → op passe à current_value, et vacg se synchronise
    await step(
      "Changer partition_date TA annuel en _ → op passe à current_value et vacg se synchronise",
      async () => {
        await pageForm.changerSelecteur("paramVacaPartitionDate", "_");
        await pageForm.expectSelecteurValeur("paramVacaOp", "current_value");
        await pageForm.expectSelecteurValeur("paramVacgPartitionDate", "_");
        await pageForm.expectSelecteurValeur("paramVacgOp", "current_value");
      },
    );

    // Remettre via vacg → doit re-synchroniser vaca
    await step(
      "Changer partition_date TA global en from_year_start → op revient à sum et vaca se synchronise",
      async () => {
        await pageForm.changerSelecteur(
          "paramVacgPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelecteurValeur("paramVacgOp", "sum");
        await pageForm.expectSelecteurValeur(
          "paramVacaPartitionDate",
          "from_year_start",
        );
        await pageForm.expectSelecteurValeur("paramVacaOp", "sum");
      },
    );

    // Synchronisation du décumul : vaca et vacg doivent avoir la même valeur
    await step(
      "Synchronisation decumul_from — vaca et vacg ont la même valeur",
      async () => {
        const valeurVaca = await page
          .locator('select[name="paramVacaDecumulFrom"]')
          .inputValue();
        await pageForm.expectSelecteurValeur(
          "paramVacgDecumulFrom",
          valeurVaca,
        );
      },
    );

    await step("Annulation des modifications", async () => {
      await pageForm.clickAnnuler();
      await pageForm.expectModeConsultation();
    });
  });

  test("doit désactiver les pondérations dept/reg quand l'indicateur n'est pas territorialisé", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    // IND-021 est territorialisé → poidsPourcentDept et poidsPourcentReg sont activés
    await step(
      "Connexion et accès à la fiche IND-021 en mode modification",
      async () => {
        await appActions.loginAs(DITP_ADMIN);
        await pageForm.goto("IND-021");
        await pageForm.ouvrirAccordionParametrages();
        await pageForm.clickModifier();
      },
    );

    await step(
      "Pondération dept et reg activées quand indicateur territorialisé",
      async () => {
        await pageForm.expectInputActive("poidsPourcentDept");
        await pageForm.expectInputActive("poidsPourcentReg");
      },
    );

    // Désactiver la territorialisation via le switch dans la section identité
    await step(
      "Désactiver la territorialisation désactive les pondérations dept et reg",
      async () => {
        await pageForm.clickSwitch("Territorialisation");
        await pageForm.expectInputDesactive("poidsPourcentDept");
        await pageForm.expectInputDesactive("poidsPourcentReg");
      },
    );

    await step("Annulation des modifications", async () => {
      await pageForm.clickAnnuler();
      await pageForm.expectModeConsultation();
    });
  });
});

test.describe("Formulaire indicateur — Création", () => {
  test("doit afficher le formulaire en mode création et permettre de créer un indicateur", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    // IND-999 n'existe pas en base, il sera initialisé comme nouvel indicateur
    const nouvelIndicateurId = "IND-999";

    await step("Connexion et accès au formulaire de création", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageForm.gotoCreation(nouvelIndicateurId);
      await pageForm.expectTitreFiche(nouvelIndicateurId);
    });

    await step("Vérification du mode création", async () => {
      await pageForm.expectModeCreation();
    });

    await step(
      "Vérification de la structure du formulaire en création",
      async () => {
        await pageForm.expectSelecteurActifInactifVisible();
        await pageForm.expectAccordionIdentiteOuvert();
        await pageForm.expectAccordionParametragesFerme();
        await pageForm.expectAccordionAutresInformationsFerme();
      },
    );
  });
});

test.describe("Formulaire indicateur — Navigation depuis le listing", () => {
  test("doit naviguer du listing vers la fiche et revenir", async ({
    page,
    e2eContext,
    step,
  }) => {
    test.setTimeout(150_000);

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
        await pageIndicateurs.rechercherIndicateur("IND-021");
        await pageIndicateurs.clickIndicateurParId("IND-021");
        await pageForm.expectTitreFiche("IND-021");
      },
    );

    await step("Retour au listing via le lien Retour", async () => {
      await pageForm.clickRetour();
      await pageIndicateurs.expectTitrePage();
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
    test.setTimeout(150_000);

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
