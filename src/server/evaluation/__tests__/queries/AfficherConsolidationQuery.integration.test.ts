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
      expect(result).toEqual([]);
    });

    it("doit retourner plusieurs rattachements pour un utilisateur avec accès multi-territoire", async () => {
      // Given
      const utilisateurId = "51234567-89ab-cdef-0123-456789abcdef";
      const rattachement1Code = "REG-03";
      const rattachement2Code = "REG-04";
      const objectif1Id = "61234567-89ab-cdef-0123-456789abcdef";
      const objectif2Id = "71234567-89ab-cdef-0123-456789abcdef";
      const fiche1Id = "81234567-89ab-cdef-0123-456789abcdef";
      const fiche2Id = "91234567-89ab-cdef-0123-456789abcdef";
      const etape1Id = "a2234567-89ab-cdef-0123-456789abcdef";
      const etape2Id = "b2234567-89ab-cdef-0123-456789abcdef";
      const evaluation1Id = "c2234567-89ab-cdef-0123-456789abcdef";
      const evaluation2Id = "d2234567-89ab-cdef-0123-456789abcdef";

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
          id: evaluation1Id,
          etape_evaluation_id: etape1Id,
          objectif_id: objectif1Id,
          auteur_id: utilisateurId,
          note: 5,
          commentaire: "Excellent",
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluation2Id,
          etape_evaluation_id: etape2Id,
          objectif_id: objectif2Id,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Moyen",
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result).toHaveLength(2);
      expect(result.find((r) => r.code === rattachement1Code)).toEqual({
        code: rattachement1Code,
        libelle: "Rattachement 1",
        objectifs: [
          {
            id: objectif1Id,
            libelle: "Objectif rattachement 1",
            evaluation: {
              id: evaluation1Id,
              note: 5,
              commentaire: "Excellent",
            },
          },
        ],
        criteres: [],
      });
      expect(result.find((r) => r.code === rattachement2Code)).toEqual({
        code: rattachement2Code,
        libelle: "Rattachement 2",
        objectifs: [
          {
            id: objectif2Id,
            libelle: "Objectif rattachement 2",
            evaluation: {
              id: evaluation2Id,
              note: 3,
              commentaire: "Moyen",
            },
          },
        ],
        criteres: [],
      });
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
      expect(result).toEqual([]);
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
      expect(result).toHaveLength(1);
      expect(result[0].objectifs).toEqual([
        {
          id: objectifId,
          libelle: "Objectif multi-étape",
          evaluation: {
            id: evaluationConsolidationId,
            note: 4,
            commentaire: "Évaluation consolidation",
          },
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
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: rattachementCode,
        libelle: "Rattachement sans évaluations",
        objectifs: [],
        criteres: [],
      });
    });
  });
});
