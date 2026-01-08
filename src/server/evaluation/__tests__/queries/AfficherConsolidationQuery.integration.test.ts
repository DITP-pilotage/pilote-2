import { $Enums } from "@prisma/client";
import { AfficherConsolidationQuery } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures as f } from "@/server/infrastructure/test/fixtures";

describe("AfficherConsolidationQuery", () => {
  let query: AfficherConsolidationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherConsolidationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "doit retourner un tableau vide quand l'utilisateur n'a pas d'accès CONSOLIDATION",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const rattachement = await f.rattachement();
        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([]);
      }),
    );

    it(
      "doit retourner plusieurs rattachements pour un utilisateur avec accès multi-territoire",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const critere1 = await f.critere({
          libelle: "Critère rattachement 1",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
        });
        await f.sousCritere({ parent_id: critere1.id });
        const critere2 = await f.critere({
          libelle: "Critère rattachement 2",
          descriptif: "Description critère 2",
          type: "SERVICES_PUBLICS",
        });
        await f.sousCritere({ parent_id: critere2.id });

        const rattachement1 = await f.rattachement({
          libelle: "Rattachement 1",
        });
        const objectif1 = await f.objectif({
          rattachement_code: rattachement1.code,
          libelle: "Objectif rattachement 1",
          descriptif: "Description objectif 1",
          indicateur_cible: "Atteindre 85% de satisfaction",
        });

        const rattachement2 = await f.rattachement({
          libelle: "Rattachement 2",
        });
        const objectif2 = await f.objectif({
          rattachement_code: rattachement2.code,
          libelle: "Objectif rattachement 2",
          descriptif: "Description objectif 2",
          indicateur_cible: "Réduire de 20% les délais",
        });

        const fiche1 = await f.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          updated_at: new Date("2025-10-10"),
        });
        const etape1 = await f.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        const fiche2 = await f.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          updated_at: new Date("2025-10-10"),
        });
        const etape2 = await f.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement1.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement2.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        const evaluationObjectif1 = await f.evaluationObjectif({
          etape_evaluation_id: etape1.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Excellent",
        });
        const evaluationObjectif2 = await f.evaluationObjectif({
          etape_evaluation_id: etape2.id,
          objectif_id: objectif2.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Moyen",
        });

        const evaluationCritere1 = await f.evaluationCritere({
          etape_evaluation_id: etape1.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Bon critère",
          annexe: "Hello world",
        });
        const evaluationCritere2 = await f.evaluationCritere({
          etape_evaluation_id: etape2.id,
          critere_id: critere2.id,
          auteur_id: utilisateur.id,
          note: 2,
          commentaire: "Critère à améliorer",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement1.code,
            libelle: "Rattachement 1",
            ficheEvaluationId: fiche1.id,
            etapeCourante: "CONSOLIDATION",
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            readOnly: false,
            objectifs: [
              {
                id: objectif1.id,
                libelle: "Objectif rattachement 1",
                descriptif: "Description objectif 1",
                indicateurCible: "Atteindre 85% de satisfaction",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationObjectif1.id,
                      note: 5,
                      commentaire: "Excellent",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: [
              {
                id: critere1.id,
                libelle: "Critère rattachement 1",
                descriptif: "Description critère 1",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationCritere1.id,
                      note: 4,
                      commentaire: "Bon critère",
                      annexe: "Hello world",
                    },
                    dateTraitement: null,
                  },
                ],
              },
              {
                id: critere2.id,
                libelle: "Critère rattachement 2",
                descriptif: "Description critère 2",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
          },
          {
            code: rattachement2.code,
            libelle: "Rattachement 2",
            ficheEvaluationId: fiche2.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            objectifs: [
              {
                id: objectif2.id,
                libelle: "Objectif rattachement 2",
                descriptif: "Description objectif 2",
                indicateurCible: "Réduire de 20% les délais",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationObjectif2.id,
                      note: 3,
                      commentaire: "Moyen",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: [
              {
                id: critere1.id,
                libelle: "Critère rattachement 1",
                descriptif: "Description critère 1",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
              {
                id: critere2.id,
                libelle: "Critère rattachement 2",
                descriptif: "Description critère 2",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationCritere2.id,
                      note: 2,
                      commentaire: "Critère à améliorer",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
          },
        ]);
      }),
    );

    it(
      "ne doit pas retourner les rattachements en auto evaluation",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur();
        const rattachement = await f.rattachement();
        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "AUTO_EVALUATION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([]);
      }),
    );

    it(
      "ne doit pas retourner les évaluations d'autres étapes",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "consolidation-user@example.com",
          nom: "Consolidation",
          prenom: "User",
        });
        const utilisateur2 = await f.utilisateur({
          email: "auto-user@example.com",
          nom: "Auto",
          prenom: "User",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement multi-étape",
        });
        const objectif = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif multi-étape",
          descriptif: "Description objectif",
          indicateur_cible: "100 dossiers traités par mois",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // Évaluation en AUTO_EVALUATION
        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur2.id,
          note: 2,
          commentaire: "Évaluation auto",
        });

        // Évaluation en CONSOLIDATION
        const evaluationConsolidation = await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Évaluation consolidation",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement multi-étape",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            objectifs: [
              {
                id: objectif.id,
                libelle: "Objectif multi-étape",
                descriptif: "Description objectif",
                indicateurCible: "100 dossiers traités par mois",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationConsolidation.id,
                      note: 4,
                      commentaire: "Évaluation consolidation",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: expect.any(Array),
          },
        ]);
      }),
    );

    it(
      "doit retourner les rattachements avec des évaluations vides par défaut",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "no-evaluations@example.com",
          nom: "No",
          prenom: "Evaluations",
        });

        const critere = await f.critere({
          libelle: "Critère sans évaluation",
          descriptif: "Description critère",
          type: "SIMPLIFICATION",
        });
        await f.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère sans évaluation",
          descriptif: "Description sous-critère",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement sans évaluations",
        });
        const objectif = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif sans évaluation",
          descriptif: "Description objectif",
          indicateur_cible: "Zéro incident de sécurité",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement sans évaluations",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            objectifs: [
              {
                id: objectif.id,
                libelle: "Objectif sans évaluation",
                descriptif: "Description objectif",
                indicateurCible: "Zéro incident de sécurité",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: [
              {
                id: critere.id,
                libelle: "Critère sans évaluation",
                descriptif: "Description critère",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
          },
        ]);
      }),
    );

    it(
      "doit retourner tous les critères du référentiel même sans évaluation",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "all-criteres@example.com",
          nom: "All",
          prenom: "Criteres",
        });

        // Créer 2 critères dans le référentiel
        const critere1 = await f.critere({
          libelle: "Critère 1",
          descriptif: "Description critère 1",
          type: "FEUILLE_DE_ROUTE",
        });
        await f.sousCritere({
          parent_id: critere1.id,
          libelle: "Sous-critère 1",
          descriptif: "Description sous-critère 1",
        });

        const critere2 = await f.critere({
          libelle: "Critère 2",
          descriptif: "Description critère 2",
          type: "COMMUNICATION",
        });
        await f.sousCritere({
          parent_id: critere2.id,
          libelle: "Sous-critère 2",
          descriptif: "Description sous-critère 2",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec critères mixtes",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const etapeEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // Evaluation uniquement pour le critère 1 seulement
        const evaluationCritere1 = await f.evaluationCritere({
          etape_evaluation_id: etapeEvaluation.id,
          critere_id: critere1.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Évaluation critère 1",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement avec critères mixtes",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            objectifs: [],
            criteres: [
              {
                id: critere1.id,
                libelle: "Critère 1",
                descriptif: "Description critère 1",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationCritere1.id,
                      note: 3,
                      commentaire: "Évaluation critère 1",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
              {
                id: critere2.id,
                libelle: "Critère 2",
                descriptif: "Description critère 2",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
          },
        ]);
      }),
    );

    it(
      "doit retourner tous les objectifs du rattachement même sans évaluation",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "all-objectifs@example.com",
          nom: "All",
          prenom: "Objectifs",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec objectifs mixtes",
        });

        // Créer un rattachement avec 2 objectifs
        const objectif1 = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 1",
          descriptif: "Description objectif 1",
          indicateur_cible: "50 nouvelles formations créées",
        });
        const objectif2 = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif 2",
          descriptif: "Description objectif 2",
          indicateur_cible: "Taux d'accessibilité > 95%",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const etapeEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // Evaluation uniquement pour l'objectif 1
        const evaluationObjectif1 = await f.evaluationObjectif({
          etape_evaluation_id: etapeEvaluation.id,
          objectif_id: objectif1.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Évaluation objectif 1",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement avec objectifs mixtes",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: false,
            objectifs: [
              {
                id: objectif1.id,
                libelle: "Objectif 1",
                descriptif: "Description objectif 1",
                indicateurCible: "50 nouvelles formations créées",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationObjectif1.id,
                      note: 5,
                      commentaire: "Évaluation objectif 1",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
              {
                id: objectif2.id,
                libelle: "Objectif 2",
                descriptif: "Description objectif 2",
                indicateurCible: "Taux d'accessibilité > 95%",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: expect.any(String),
                      note: null,
                      commentaire: "",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: expect.any(Array),
          },
        ]);
      }),
    );

    it(
      "doit retourner les fiches en phase INSTRUCTION en mode lecture seule",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "instruction@example.com",
          nom: "Instruction",
          prenom: "User",
        });

        const critere = await f.critere({
          libelle: "Critère en instruction",
          descriptif: "Description critère",
          type: "SERVICES_PUBLICS",
        });
        await f.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère",
          descriptif: "Description sous-critère",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement en instruction",
        });
        const objectif = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif en instruction",
          descriptif: "Description objectif",
          indicateur_cible: "100% de conformité",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "INSTRUCTION",
        });
        await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: false,
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        const evaluationObjectifConso = await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Évaluation en instruction",
        });

        const evaluationCritereConso = await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 3,
          commentaire: "Critère en instruction",
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement en instruction",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: $Enums.etape_evaluation_enum.INSTRUCTION,
            readOnly: true,
            objectifs: [
              {
                id: objectif.id,
                libelle: "Objectif en instruction",
                descriptif: "Description objectif",
                indicateurCible: "100% de conformité",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationObjectifConso.id,
                      note: 4,
                      commentaire: "Évaluation en instruction",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ],
            criteres: expect.arrayContaining([
              {
                id: critere.id,
                libelle: "Critère en instruction",
                descriptif: "Description critère",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationCritereConso.id,
                      note: 3,
                      commentaire: "Critère en instruction",
                      annexe: "",
                    },
                    dateTraitement: null,
                  },
                ],
              },
            ]),
          },
        ]);
      }),
    );

    it(
      "ne doit retourner que les données de consolidation même si des données d'auto-évaluation existent",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await f.utilisateur({
          email: "consolidation@example.com",
          nom: "Consolidation",
          prenom: "User",
        });
        const utilisateurAuto = await f.utilisateur({
          email: "auto@example.com",
          nom: "Auto",
          prenom: "User",
        });

        const critere = await f.critere({
          libelle: "Critère avec auto-évaluation",
          descriptif: "Description critère",
          type: "SIMPLIFICATION",
        });
        await f.sousCritere({
          parent_id: critere.id,
          libelle: "Sous-critère",
          descriptif: "Description sous-critère",
        });

        const rattachement = await f.rattachement({
          libelle: "Rattachement avec auto-évaluation",
        });
        const objectif = await f.objectif({
          rattachement_code: rattachement.code,
          libelle: "Objectif avec auto-évaluation",
          descriptif: "Description objectif",
          indicateur_cible: "Diminution de 15% des émissions CO2",
        });

        const fiche = await f.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const etapeAutoEvaluation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
        });
        const etapeConsolidation = await f.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
          updated_at: new Date("2025-10-10"),
        });

        await f.rattachementUtilisateurEtapeJalon({
          rattachement_code: rattachement.code,
          utilisateur_id: utilisateur.id,
          etape: "CONSOLIDATION",
        });

        // Évaluations en AUTO_EVALUATION
        await f.evaluationObjectif({
          etape_evaluation_id: etapeAutoEvaluation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateurAuto.id,
          note: 3,
          commentaire: "Auto-évaluation objectif",
        });

        await f.evaluationCritere({
          etape_evaluation_id: etapeAutoEvaluation.id,
          critere_id: critere.id,
          auteur_id: utilisateurAuto.id,
          note: 2,
          commentaire: "Auto-évaluation critère",
        });

        // Évaluations en CONSOLIDATION
        const dateTraitementObjectif = new Date("2025-01-15T10:30:00Z");
        const dateTraitementCritere = new Date("2025-01-20T14:45:00Z");

        const evaluationObjectifConso = await f.evaluationObjectif({
          etape_evaluation_id: etapeConsolidation.id,
          objectif_id: objectif.id,
          auteur_id: utilisateur.id,
          note: 4,
          commentaire: "Consolidation objectif",
          date_traitement: dateTraitementObjectif,
        });

        const evaluationCritereConso = await f.evaluationCritere({
          etape_evaluation_id: etapeConsolidation.id,
          critere_id: critere.id,
          auteur_id: utilisateur.id,
          note: 5,
          commentaire: "Consolidation critère",
          date_traitement: dateTraitementCritere,
        });

        // When
        const result = await query.run({ utilisateurId: utilisateur.id });

        // Then
        expect(result.rattachements).toEqual([
          {
            code: rattachement.code,
            libelle: "Rattachement avec auto-évaluation",
            ficheEvaluationId: fiche.id,
            dateDerniereModification: "2025-10-10T00:00:00.000Z",
            etapeCourante: "CONSOLIDATION",
            readOnly: true,
            objectifs: [
              {
                id: objectif.id,
                libelle: "Objectif avec auto-évaluation",
                descriptif: "Description objectif",
                indicateurCible: "Diminution de 15% des émissions CO2",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationObjectifConso.id,
                      note: 4,
                      commentaire: "Consolidation objectif",
                      annexe: "",
                    },
                    dateTraitement: dateTraitementObjectif.toISOString(),
                  },
                ],
              },
            ],
            criteres: expect.arrayContaining([
              {
                id: critere.id,
                libelle: "Critère avec auto-évaluation",
                descriptif: "Description critère",
                evaluations: [
                  {
                    etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                    evaluation: {
                      id: evaluationCritereConso.id,
                      note: 5,
                      commentaire: "Consolidation critère",
                      annexe: "",
                    },
                    dateTraitement: dateTraitementCritere.toISOString(),
                  },
                ],
              },
            ]),
          },
        ]);
      }),
    );
  });
});
