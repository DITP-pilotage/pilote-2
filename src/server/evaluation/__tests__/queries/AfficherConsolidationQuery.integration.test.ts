import { $Enums } from "@prisma/client";
import { AfficherConsolidationQuery } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("AfficherConsolidationQuery", () => {
  let query: AfficherConsolidationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherConsolidationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner un tableau vide quand l'utilisateur n'a pas d'accès CONSOLIDATION", async () => {
      // Given
      const utilisateurId = "f1234567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-01";
      const ficheEvaluationId = "a1234567-89ab-cdef-0123-456789abcdef";
      const etapeEvaluationId = "b1234567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "no-access@example.com",
          nom: "No Access",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement sans accès",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([]);
    });

    it("doit retourner plusieurs rattachements pour un utilisateur avec accès multi-territoire", async () => {
      // Given
      const utilisateurId = "51234567-89ab-cdef-0123-456789abcdef";
      const rattachement1Code = "REG-03";
      const rattachement2Code = "REG-04";
      const critere1Id = "52234567-89ab-cdef-0123-456789abcdef";
      const critere2Id = "53234567-89ab-cdef-0123-456789abcdef";
      const sousCritere1Id = "54234567-89ab-cdef-0123-456789abcdef";
      const sousCritere2Id = "55234567-89ab-cdef-0123-456789abcdef";
      const objectif1Id = "61234567-89ab-cdef-0123-456789abcdef";
      const objectif2Id = "71234567-89ab-cdef-0123-456789abcdef";
      const fiche1Id = "81234567-89ab-cdef-0123-456789abcdef";
      const fiche2Id = "91234567-89ab-cdef-0123-456789abcdef";
      const etape1Id = "a2234567-89ab-cdef-0123-456789abcdef";
      const etape2Id = "b2234567-89ab-cdef-0123-456789abcdef";
      const evaluationObjectif1Id = "c2234567-89ab-cdef-0123-456789abcdef";
      const evaluationObjectif2Id = "d2234567-89ab-cdef-0123-456789abcdef";
      const evaluationCritere1Id = "e2234567-89ab-cdef-0123-456789abcdea";
      const evaluationCritere2Id = "f2234567-89ab-cdef-0123-456789abcdea";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "multi-territoire@example.com",
          nom: "Multi",
          prenom: "Territoire",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere1Id,
          libelle: "Critère rattachement 1",
          descriptif: "Description critère 1",
          sous_criteres: {
            create: {
              id: sousCritere1Id,
              libelle: "Sous-critère 1",
              descriptif: "Description sous-critère 1",
            },
          },
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere2Id,
          libelle: "Critère rattachement 2",
          descriptif: "Description critère 2",
          sous_criteres: {
            create: {
              id: sousCritere2Id,
              libelle: "Sous-critère 2",
              descriptif: "Description sous-critère 2",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement1Code,
          libelle: "Rattachement 1",
          objectifs: {
            create: {
              id: objectif1Id,
              libelle: "Objectif rattachement 1",
              descriptif: "Description objectif 1",
              jalon: 2025,
              indicateur_cible: "Atteindre 85% de satisfaction",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement2Code,
          libelle: "Rattachement 2",
          objectifs: {
            create: {
              id: objectif2Id,
              libelle: "Objectif rattachement 2",
              descriptif: "Description objectif 2",
              jalon: 2025,
              indicateur_cible: "Réduire de 20% les délais",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: fiche1Id,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement1Code,
          etape_evaluations: {
            create: {
              id: etape1Id,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: fiche2Id,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement2Code,
          etape_evaluations: {
            create: {
              id: etape2Id,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "e2234567-89ab-cdef-0123-456789abcdee",
          rattachement_code: rattachement1Code,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "f2234567-89ab-cdef-0123-456789abcdee",
          rattachement_code: rattachement2Code,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectif1Id,
          etape_evaluation_id: etape1Id,
          objectif_id: objectif1Id,
          auteur_id: utilisateurId,
          note: 5,
          commentaire: "Excellent",
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectif2Id,
          etape_evaluation_id: etape2Id,
          objectif_id: objectif2Id,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Moyen",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritere1Id,
          etape_evaluation_id: etape1Id,
          critere_id: critere1Id,
          auteur_id: utilisateurId,
          note: 4,
          commentaire: "Bon critère",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritere2Id,
          etape_evaluation_id: etape2Id,
          critere_id: critere2Id,
          auteur_id: utilisateurId,
          note: 2,
          commentaire: "Critère à améliorer",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachement1Code,
          libelle: "Rattachement 1",
          ficheEvaluationId: fiche1Id,
          readOnly: false,
          objectifs: [
            {
              id: objectif1Id,
              libelle: "Objectif rattachement 1",
              descriptif: "Description objectif 1",
              indicateurCible: "Atteindre 85% de satisfaction",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationObjectif1Id,
                    note: 5,
                    commentaire: "Excellent",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
          criteres: [
            {
              id: critere1Id,
              libelle: "Critère rattachement 1",
              descriptif: "Description critère 1",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationCritere1Id,
                    note: 4,
                    commentaire: "Bon critère",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
            {
              id: critere2Id,
              libelle: "Critère rattachement 2",
              descriptif: "Description critère 2",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
        },
        {
          code: rattachement2Code,
          libelle: "Rattachement 2",
          ficheEvaluationId: fiche2Id,
          readOnly: false,
          objectifs: [
            {
              id: objectif2Id,
              libelle: "Objectif rattachement 2",
              descriptif: "Description objectif 2",
              indicateurCible: "Réduire de 20% les délais",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationObjectif2Id,
                    note: 3,
                    commentaire: "Moyen",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
          criteres: [
            {
              id: critere1Id,
              libelle: "Critère rattachement 1",
              descriptif: "Description critère 1",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
            {
              id: critere2Id,
              libelle: "Critère rattachement 2",
              descriptif: "Description critère 2",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationCritere2Id,
                    note: 2,
                    commentaire: "Critère à améliorer",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
        },
      ]);
    });

    it("ne doit pas retourner les rattachements dans d'autres étapes", async () => {
      // Given
      const utilisateurId = "e2234567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-05";
      const ficheEvaluationId = "f2234567-89ab-cdef-0123-456789abcdef";
      const etapeEvaluationId = "12334567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "wrong-step@example.com",
          nom: "Wrong",
          prenom: "Step",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement en auto-évaluation",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION", // Pas en CONSOLIDATION
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "22334567-89ab-cdef-0123-456789abcdee",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([]);
    });

    it("ne doit pas retourner les évaluations d'autres étapes", async () => {
      // Given
      const utilisateurId = "22334567-89ab-cdef-0123-456789abcdef";
      const utilisateur2Id = "32334567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-06";
      const objectifId = "42334567-89ab-cdef-0123-456789abcdef";
      const ficheEvaluationId = "52334567-89ab-cdef-0123-456789abcdef";
      const etapeAutoEvaluationId = "62334567-89ab-cdef-0123-456789abcdef";
      const etapeConsolidationId = "72334567-89ab-cdef-0123-456789abcdef";
      const evaluationAutoId = "82334567-89ab-cdef-0123-456789abcdef";
      const evaluationConsolidationId = "92334567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "consolidation-user@example.com",
          nom: "Consolidation",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateur2Id,
          email: "auto-user@example.com",
          nom: "Auto",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement multi-étape",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif multi-étape",
              descriptif: "Description objectif",
              jalon: 2025,
              indicateur_cible: "100 dossiers traités par mois",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "a2334567-89ab-cdef-0123-456789abcdee",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // Évaluation en AUTO_EVALUATION
      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationAutoId,
          etape_evaluation_id: etapeAutoEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateur2Id,
          note: 2,
          commentaire: "Évaluation auto",
        },
      });

      // Évaluation en CONSOLIDATION
      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationConsolidationId,
          etape_evaluation_id: etapeConsolidationId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: 4,
          commentaire: "Évaluation consolidation",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachementCode,
          libelle: "Rattachement multi-étape",
          ficheEvaluationId,
          readOnly: false,
          objectifs: [
            {
              id: objectifId,
              libelle: "Objectif multi-étape",
              descriptif: "Description objectif",
              indicateurCible: "100 dossiers traités par mois",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationConsolidationId,
                    note: 4,
                    commentaire: "Évaluation consolidation",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: evaluationAutoId,
                    note: 2,
                    commentaire: "Évaluation auto",
                  },
                },
              ],
            },
          ],
          criteres: expect.any(Array),
        },
      ]);
    });

    it("doit retourner les rattachements sans évaluations quand aucune évaluation n'existe", async () => {
      // Given
      const utilisateurId = "a3334567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-07";
      const critereId = "b3334567-89ab-cdef-0123-456789abcdef";
      const sousCritereId = "c3334567-89ab-cdef-0123-456789abcdef";
      const objectifId = "d3334567-89ab-cdef-0123-456789abcdef";
      const ficheEvaluationId = "e3334567-89ab-cdef-0123-456789abcdef";
      const etapeEvaluationId = "f3334567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "no-evaluations@example.com",
          nom: "No",
          prenom: "Evaluations",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère sans évaluation",
          descriptif: "Description critère",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère sans évaluation",
              descriptif: "Description sous-critère",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement sans évaluations",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif sans évaluation",
              descriptif: "Description objectif",
              jalon: 2025,
              indicateur_cible: "Zéro incident de sécurité",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "13334567-89ab-cdef-0123-456789abcdee",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachementCode,
          libelle: "Rattachement sans évaluations",
          ficheEvaluationId,
          readOnly: false,
          objectifs: [
            {
              id: objectifId,
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
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
          criteres: [
            {
              id: critereId,
              libelle: "Critère sans évaluation",
              descriptif: "Description critère",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
        },
      ]);
    });

    it("doit retourner tous les critères du référentiel même sans évaluation", async () => {
      // Given
      const utilisateurId = "d4434567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-10";
      const critere1Id = "e4434567-89ab-cdef-0123-456789abcdef";
      const critere2Id = "f4434567-89ab-cdef-0123-456789abcdef";
      const sousCritere1Id = "24534567-89ab-cdef-0123-456789abcdef";
      const sousCritere2Id = "34534567-89ab-cdef-0123-456789abcdef";
      const ficheEvaluationId = "54534567-89ab-cdef-0123-456789abcdef";
      const etapeEvaluationId = "64534567-89ab-cdef-0123-456789abcdef";
      const evaluationCritere1Id = "74534567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "all-criteres@example.com",
          nom: "All",
          prenom: "Criteres",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      // Créer 2 critères dans le référentiel
      await prisma.referentiel_critere.create({
        data: {
          id: critere1Id,
          libelle: "Critère 1",
          descriptif: "Description critère 1",
          sous_criteres: {
            create: {
              id: sousCritere1Id,
              libelle: "Sous-critère 1",
              descriptif: "Description sous-critère 1",
            },
          },
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critere2Id,
          libelle: "Critère 2",
          descriptif: "Description critère 2",
          sous_criteres: {
            create: {
              id: sousCritere2Id,
              libelle: "Sous-critère 2",
              descriptif: "Description sous-critère 2",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec critères mixtes",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "84534567-89ab-cdef-0123-456789abcdef",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // Evaluation uniquement pour le critère 1 seulement
      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritere1Id,
          etape_evaluation_id: etapeEvaluationId,
          critere_id: critere1Id,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Évaluation critère 1",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachementCode,
          libelle: "Rattachement avec critères mixtes",
          ficheEvaluationId,
          readOnly: false,
          objectifs: [],
          criteres: [
            {
              id: critere1Id,
              libelle: "Critère 1",
              descriptif: "Description critère 1",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationCritere1Id,
                    note: 3,
                    commentaire: "Évaluation critère 1",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
            {
              id: critere2Id,
              libelle: "Critère 2",
              descriptif: "Description critère 2",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
        },
      ]);
    });

    it("doit retourner tous les objectifs du rattachement même sans évaluation", async () => {
      // Given
      const utilisateurId = "94534567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-11";
      const objectif1Id = "a4534567-89ab-cdef-0123-456789abcdef";
      const objectif2Id = "b4534567-89ab-cdef-0123-456789abcdef";
      const ficheEvaluationId = "d4634567-89ab-cdef-0123-456789abcdef";
      const etapeEvaluationId = "e4634567-89ab-cdef-0123-456789abcdef";
      const evaluationObjectif1Id = "f4634567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "all-objectifs@example.com",
          nom: "All",
          prenom: "Objectifs",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      // Créer un rattachement avec 2 objectifs
      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec objectifs mixtes",
          objectifs: {
            create: [
              {
                id: objectif1Id,
                libelle: "Objectif 1",
                descriptif: "Description objectif 1",
                jalon: 2025,
                indicateur_cible: "50 nouvelles formations créées",
              },
              {
                id: objectif2Id,
                libelle: "Objectif 2",
                descriptif: "Description objectif 2",
                jalon: 2025,
                indicateur_cible: "Taux d'accessibilité > 95%",
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "14634567-89ab-cdef-0123-456789abcdef",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // Evaluation uniquement pour l'objectif 1
      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectif1Id,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectif1Id,
          auteur_id: utilisateurId,
          note: 5,
          commentaire: "Évaluation objectif 1",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachementCode,
          libelle: "Rattachement avec objectifs mixtes",
          ficheEvaluationId,
          readOnly: false,
          objectifs: [
            {
              id: objectif1Id,
              libelle: "Objectif 1",
              descriptif: "Description objectif 1",
              indicateurCible: "50 nouvelles formations créées",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationObjectif1Id,
                    note: 5,
                    commentaire: "Évaluation objectif 1",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
            {
              id: objectif2Id,
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
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: expect.any(String),
                    note: null,
                    commentaire: "",
                  },
                },
              ],
            },
          ],
          criteres: expect.any(Array),
        },
      ]);
    });

    it("doit retourner les données d'auto-évaluation pour chaque objectif et critère", async () => {
      // Given
      const utilisateurId = "c4634567-89ab-cdef-0123-456789abcdef";
      const utilisateurAutoId = "d4634567-89ab-cdef-0123-456789abcdef";
      const rattachementCode = "REG-12";
      const objectifId = "e4634567-89ab-cdef-0123-456789abcdef";
      const critereId = "f4634567-89ab-cdef-0123-456789abcdef";
      const sousCritereId = "14734567-89ab-cdef-0123-456789abcdef";
      const ficheEvaluationId = "24734567-89ab-cdef-0123-456789abcdef";
      const etapeAutoEvaluationId = "34734567-89ab-cdef-0123-456789abcdef";
      const etapeConsolidationId = "44734567-89ab-cdef-0123-456789abcdef";
      const evaluationObjectifAutoId = "54734567-89ab-cdef-0123-456789abcdef";
      const evaluationObjectifConsoId = "64734567-89ab-cdef-0123-456789abcdef";
      const evaluationCritereAutoId = "74734567-89ab-cdef-0123-456789abcdef";
      const evaluationCritereConsoId = "84734567-89ab-cdef-0123-456789abcdef";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "consolidation@example.com",
          nom: "Consolidation",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurAutoId,
          email: "auto@example.com",
          nom: "Auto",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère avec auto-évaluation",
          descriptif: "Description critère",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère",
              descriptif: "Description sous-critère",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec auto-évaluation",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif avec auto-évaluation",
              descriptif: "Description objectif",
              jalon: 2025,
              indicateur_cible: "Diminution de 15% des émissions CO2",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
                read_only: true,
              },
            ],
          },
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "94734567-89ab-cdef-0123-456789abcdef",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      // Évaluations en AUTO_EVALUATION
      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifAutoId,
          etape_evaluation_id: etapeAutoEvaluationId,
          objectif_id: objectifId,
          auteur_id: utilisateurAutoId,
          note: 3,
          commentaire: "Auto-évaluation objectif",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritereAutoId,
          etape_evaluation_id: etapeAutoEvaluationId,
          critere_id: critereId,
          auteur_id: utilisateurAutoId,
          note: 2,
          commentaire: "Auto-évaluation critère",
        },
      });

      // Évaluations en CONSOLIDATION
      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifConsoId,
          etape_evaluation_id: etapeConsolidationId,
          objectif_id: objectifId,
          auteur_id: utilisateurId,
          note: 4,
          commentaire: "Consolidation objectif",
        },
      });

      await prisma.evaluation_critere.create({
        data: {
          id: evaluationCritereConsoId,
          etape_evaluation_id: etapeConsolidationId,
          critere_id: critereId,
          auteur_id: utilisateurId,
          note: 5,
          commentaire: "Consolidation critère",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result.rattachements).toEqual([
        {
          code: rattachementCode,
          libelle: "Rattachement avec auto-évaluation",
          ficheEvaluationId,
          readOnly: true,
          objectifs: [
            {
              id: objectifId,
              libelle: "Objectif avec auto-évaluation",
              descriptif: "Description objectif",
              indicateurCible: "Diminution de 15% des émissions CO2",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationObjectifConsoId,
                    note: 4,
                    commentaire: "Consolidation objectif",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: evaluationObjectifAutoId,
                    note: 3,
                    commentaire: "Auto-évaluation objectif",
                  },
                },
              ],
            },
          ],
          criteres: expect.arrayContaining([
            {
              id: critereId,
              libelle: "Critère avec auto-évaluation",
              descriptif: "Description critère",
              evaluations: [
                {
                  etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
                  evaluation: {
                    id: evaluationCritereConsoId,
                    note: 5,
                    commentaire: "Consolidation critère",
                  },
                },
                {
                  etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                  evaluation: {
                    id: evaluationCritereAutoId,
                    note: 2,
                    commentaire: "Auto-évaluation critère",
                  },
                },
              ],
            },
          ]),
        },
      ]);
    });
  });
});
