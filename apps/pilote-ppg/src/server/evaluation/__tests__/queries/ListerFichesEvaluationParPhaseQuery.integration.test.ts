import { $Enums } from "@prisma/client";
import { ListerFichesEvaluationParPhaseQuery } from "@/server/evaluation/queries/ListerFichesEvaluationParPhaseQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";

describe("ListerFichesEvaluationParPhaseQuery", () => {
  let query: ListerFichesEvaluationParPhaseQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerFichesEvaluationParPhaseQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner les fiches groupées par groupe de rattachement puis par phase",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const regGroupe = await f.rattachementGroupe({
          code: "REG-01",
          libelle: "Groupe Région 01",
        });
        const deptGroupe = await f.rattachementGroupe({
          code: "DEPT-01",
          libelle: "Groupe Département 01",
        });

        const regRattachementGroupe = await f.rattachement({
          groupe: regGroupe.code,
          ordre: 0,
          libelle: "Région 01",
        });
        const regRattachement = await f.rattachement({
          groupe: regGroupe.code,
          ordre: 1,
          libelle: "Région 02",
        });
        const deptRattachementGroupe = await f.rattachement({
          groupe: deptGroupe.code,
          ordre: 0,
          libelle: "Département 01",
        });
        const deptRattachement = await f.rattachement({
          groupe: deptGroupe.code,
          ordre: 1,
          libelle: "Département 02",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: regRattachementGroupe.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: regRattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: deptRattachementGroupe.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: deptRattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const ficheAutoEval1 = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: regRattachementGroupe.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: ficheAutoEval1.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const ficheAutoEval2 = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: regRattachement.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: ficheAutoEval2.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const ficheConsolidation = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: deptRattachement.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: ficheConsolidation.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result).toEqual({
          "Groupe Département 01": {
            [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: [],
            [$Enums.etape_evaluation_enum.CONSOLIDATION]: [
              {
                id: ficheConsolidation.id,
                etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
                readOnly: false,
                isObjectifsValides: true,
                isCriteresValides: true,
                rattachement: {
                  code: deptRattachement.code,
                  libelle: "Département 02",
                },
                objectifs: {
                  moyenne: null,
                  moyennesParPhase: {
                    [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                  },
                  nombreNotes: 0,
                  nombreTotal: 0,
                  nombreTraites: 0,
                },
                criteres: {
                  moyenne: null,
                  moyennesParPhase: {
                    [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                  },
                  nombreNotes: 0,
                  nombreTotal: 0,
                  nombreTraites: 0,
                },
                noteCollective: null,
              },
            ],
            [$Enums.etape_evaluation_enum.INSTRUCTION]: [],
          },
        });
      }),
    );

    it(
      "ne doit retourner que les fiches pour lesquelles l'utilisateur a des permissions",
      createIntegrationTest(async () => {
        // Given
        const utilisateurAvecPermission = await f.utilisateur();
        const utilisateurSansPermission = await f.utilisateur();
        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région restreinte",
        });
        const rattachement = await f.rattachement({
          groupe: groupe.code,
          libelle: "Région restreinte",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateurAvecPermission.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        const resultSansPermission = await query.run({
          utilisateurId: utilisateurSansPermission.id,
        });
        const resultAvecPermission = await query.run({
          utilisateurId: utilisateurAvecPermission.id,
        });

        // Then
        expect(resultSansPermission).toEqual({});
        expect(resultAvecPermission).toEqual({
          "Groupe Région restreinte": {
            [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: [],
            [$Enums.etape_evaluation_enum.CONSOLIDATION]: [
              {
                id: fiche.id,
                etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
                readOnly: false,
                isObjectifsValides: true,
                isCriteresValides: true,
                rattachement: {
                  code: rattachement.code,
                  libelle: "Région restreinte",
                },
                objectifs: {
                  moyenne: null,
                  moyennesParPhase: {
                    [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                  },
                  nombreNotes: 0,
                  nombreTotal: 0,
                  nombreTraites: 0,
                },
                criteres: {
                  moyenne: null,
                  moyennesParPhase: {
                    [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                  },
                  nombreNotes: 0,
                  nombreTotal: 0,
                  nombreTraites: 0,
                },
                noteCollective: null,
              },
            ],
            [$Enums.etape_evaluation_enum.INSTRUCTION]: [],
          },
        });
      }),
    );

    it(
      "doit calculer la note collective à partir des chantiers_evaluation de la dernière date_calcul",
      createIntegrationTest(async () => {
        // Given
        const chantier1 = await f.chantierIdentite({
          id: "CH-NC-001",
          nom: "Chantier NC 1",
        });
        const chantier2 = await f.chantierIdentite({
          id: "CH-NC-002",
          nom: "Chantier NC 2",
        });

        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région avec note collective",
        });
        const rattachement = await f.rattachement({
          code: "REG-84",
          groupe: groupe.code,
          libelle: "Région avec note collective",
        });

        await f.chantierTerritoire({
          id: chantier1.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
        });
        await f.chantierTerritoire({
          id: chantier2.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
        });

        await f.chantierTerritoireJalon({
          id: chantier1.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          taux_avancement: 68.0,
        });
        await f.chantierTerritoireJalon({
          id: chantier2.id,
          territoire_code: "REG-84",
          code_insee: "84",
          maille: "REG",
          zone_id: "R84",
          taux_avancement: 73.0,
        });

        const utilisateur = await f.utilisateur();

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
          rattachement_code: rattachement.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.INSTRUCTION,
        });

        await f.chantierEvaluation({
          id: chantier1.id,
          territoire_code: "REG-84",
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-nc-1",
          taux_avancement: 50,
          date_calcul: new Date("2025-01-10"),
        });
        await f.chantierEvaluation({
          id: chantier2.id,
          territoire_code: "REG-84",
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-nc-1",
          taux_avancement: 60,
          date_calcul: new Date("2025-01-10"),
        });
        await f.chantierEvaluation({
          id: chantier1.id,
          territoire_code: "REG-84",
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-nc-1",
          taux_avancement: 70,
          date_calcul: new Date("2025-01-15"),
        });
        await f.chantierEvaluation({
          id: chantier2.id,
          territoire_code: "REG-84",
          code_insee: "75",
          maille: "DEPT",
          zone_id: "zone-nc-1",
          taux_avancement: 90,
          date_calcul: new Date("2025-01-15"),
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(
          result["Groupe Région avec note collective"][
            $Enums.etape_evaluation_enum.INSTRUCTION
          ],
        ).toEqual([
          {
            id: fiche.id,
            etapeCourante: $Enums.etape_evaluation_enum.INSTRUCTION,
            readOnly: false,
            isObjectifsValides: true,
            isCriteresValides: true,
            rattachement: {
              code: rattachement.code,
              libelle: "Région avec note collective",
            },
            objectifs: {
              moyenne: null,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.INSTRUCTION]: null,
              },
              nombreNotes: 0,
              nombreTotal: 0,
              nombreTraites: 0,
            },
            criteres: {
              moyenne: null,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.INSTRUCTION]: null,
              },
              nombreNotes: 0,
              nombreTotal: 0,
              nombreTraites: 0,
            },
            noteCollective: 80,
          },
        ]);
      }),
    );

    it(
      "doit calculer moyennesParPhase uniquement pour la phase CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région moyennes phases",
        });
        const rattachement = await f.rattachement({
          groupe: groupe.code,
          libelle: "Région moyennes phases",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const objectif1 = await f.objectif({
          descriptif: "objectif 1",
          rattachement_code: rattachement.code,
          libelle: "Objectif 1",
        });
        const objectif2 = await f.objectif({
          descriptif: "objectif 2",
          rattachement_code: rattachement.code,
          libelle: "Objectif 2",
        });

        const critere = await f.critere({
          descriptif: "Critère 2",
          libelle: "Critère 1",
        });

        const fiche = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement.code,
        });

        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          objectif_id: objectif1.id,
          note: 10,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          objectif_id: objectif2.id,
          note: 20,
        });
        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          critere_id: critere.id,
          note: 15,
        });

        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          objectif_id: objectif1.id,
          note: 30,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          objectif_id: objectif2.id,
          note: 40,
        });
        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          commentaire: "Un commentaire",
          auteur_id: utilisateur.id,
          critere_id: critere.id,
          note: 25,
          date_traitement: new Date(),
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(
          result["Groupe Région moyennes phases"][
            $Enums.etape_evaluation_enum.CONSOLIDATION
          ],
        ).toEqual([
          {
            id: fiche.id,
            etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            isObjectifsValides: false,
            isCriteresValides: true,
            readOnly: false,
            rattachement: {
              code: rattachement.code,
              libelle: "Région moyennes phases",
            },
            objectifs: {
              moyenne: 35,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.CONSOLIDATION]: 35,
              },
              nombreNotes: 2,
              nombreTotal: 2,
              nombreTraites: 0,
            },
            criteres: {
              moyenne: 25,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.CONSOLIDATION]: 25,
              },
              nombreNotes: 1,
              nombreTotal: 1,
              nombreTraites: 1,
            },
            noteCollective: null,
          },
        ]);
      }),
    );

    it(
      "ne doit retourner une fiche que dans la phase correspondant à son etape_courante, même si l'utilisateur a des permissions pour plusieurs phases",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région multi-phases",
        });
        const rattachement = await f.rattachement({
          groupe: groupe.code,
          libelle: "Région multi-phases",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachement.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result).toEqual({});
      }),
    );

    it(
      "doit ordonner les fiches par ordre du rattachement dans chaque groupe",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région 30",
        });

        await f.rattachement({
          groupe: groupe.code,
          ordre: 0,
          libelle: "Région 30",
        });
        const rattachement1 = await f.rattachement({
          groupe: groupe.code,
          ordre: 3,
          libelle: "Rattachement ordre 3",
        });
        const rattachement2 = await f.rattachement({
          groupe: groupe.code,
          ordre: 1,
          libelle: "Rattachement ordre 1",
        });
        const rattachement3 = await f.rattachement({
          groupe: groupe.code,
          ordre: 2,
          libelle: "Rattachement ordre 2",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement1.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement2.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement3.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche1 = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement1.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche2 = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement2.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche3 = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement3.code,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(
          result["Groupe Région 30"][
            $Enums.etape_evaluation_enum.CONSOLIDATION
          ].map((fiche) => fiche.id),
        ).toEqual([fiche2.id, fiche3.id, fiche1.id]);
      }),
    );

    it(
      "ne doit pas inclure les évaluations AUTO_EVALUATION dans les moyennesParPhase ni dans le calcul des notes",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const groupe = await f.rattachementGroupe({
          libelle: "Groupe Région test auto-évaluation",
        });
        const rattachement = await f.rattachement({
          groupe: groupe.code,
          libelle: "Région test auto-évaluation",
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const objectif = await f.objectif({
          descriptif: "objectif test",
          rattachement_code: rattachement.code,
          libelle: "Objectif test",
        });

        const critere = await f.critere({
          descriptif: "Critère test",
          libelle: "Critère test",
        });

        const fiche = await f.fiche({
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachement.code,
        });

        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          commentaire: "Note auto-évaluation",
          auteur_id: utilisateur.id,
          objectif_id: objectif.id,
          note: 50,
        });
        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          commentaire: "Note auto-évaluation",
          auteur_id: utilisateur.id,
          critere_id: critere.id,
          note: 60,
        });

        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          commentaire: "Note consolidation",
          auteur_id: utilisateur.id,
          objectif_id: objectif.id,
          note: 70,
          date_traitement: new Date(),
        });
        await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          commentaire: "Note consolidation",
          auteur_id: utilisateur.id,
          critere_id: critere.id,
          note: 80,
          date_traitement: new Date(),
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(
          result["Groupe Région test auto-évaluation"][
            $Enums.etape_evaluation_enum.CONSOLIDATION
          ],
        ).toEqual([
          {
            id: fiche.id,
            etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            isObjectifsValides: true,
            isCriteresValides: true,
            readOnly: false,
            rattachement: {
              code: rattachement.code,
              libelle: "Région test auto-évaluation",
            },
            objectifs: {
              moyenne: 70,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.CONSOLIDATION]: 70,
              },
              nombreNotes: 1,
              nombreTotal: 1,
              nombreTraites: 1,
            },
            criteres: {
              moyenne: 80,
              moyennesParPhase: {
                [$Enums.etape_evaluation_enum.CONSOLIDATION]: 80,
              },
              nombreNotes: 1,
              nombreTotal: 1,
              nombreTraites: 1,
            },
            noteCollective: null,
          },
        ]);
      }),
    );
  });
});
