import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("AfficherAutoEvaluationQuery", () => {
  let query: AfficherAutoEvaluationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherAutoEvaluationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner les critères et objectifs sans évaluations quand aucune évaluation n'existe", async () => {
      // Given
      const critere1Id = "9db7282a-9048-425a-a4f8-c3d60be6153b";
      const critere2Id = "f39ee3b9-cceb-429c-b1bd-6e6e2d4104ca";
      const sousCritere1Id = "cdd3adf2-9cb2-48ae-9187-6ebf87341afa";
      const sousCritere2Id = "b03aefd8-479c-46a1-b964-5540f5779422";
      const rattachementCode = "REG-75";
      const objectif1Id = "66b7dca2-8135-44ad-b621-00e5577de68c";
      const objectif2Id = "f4871fc7-f71e-403a-a16c-d6a663b38e37";
      const ficheEvaluationId = "c087c37f-f7a3-4044-927a-dd99c6d3993e";
      const etapeEvaluationId = "5fc648d8-2900-4032-871e-730e06a1477c";

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
          libelle: "Rattachement 1",
          objectifs: {
            create: [
              {
                id: objectif1Id,
                libelle: "Objectif 1",
                descriptif: "Description objectif 1",
                jalon: 2025,
              },
              {
                id: objectif2Id,
                libelle: "Objectif 2",
                descriptif: "Description objectif 2",
                jalon: 2025,
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run({ ficheEvaluationId });

      // Then
      expect(result.criteres).toHaveLength(2);
      expect(result.criteres[0]).toEqual({
        id: critere1Id,
        libelle: "Critère 1",
        sousCriteres: [
          {
            id: sousCritere1Id,
            nom: "Sous-critère 1",
            evaluation: {
              note: null,
              commentaire: "",
            },
          },
        ],
      });
      expect(result.criteres[1]).toEqual({
        id: critere2Id,
        libelle: "Critère 2",
        sousCriteres: [
          {
            id: sousCritere2Id,
            nom: "Sous-critère 2",
            evaluation: {
              note: null,
              commentaire: "",
            },
          },
        ],
      });
      expect(result.objectifs).toHaveLength(2);
      expect(result.objectifs[0]).toEqual({
        id: objectif1Id,
        libelle: "Objectif 1",
        evaluation: {
          note: null,
          commentaire: "",
        },
      });
      expect(result.objectifs[1]).toEqual({
        id: objectif2Id,
        libelle: "Objectif 2",
        evaluation: {
          note: null,
          commentaire: "",
        },
      });
      expect(result.readOnly).toBe(false);
      expect(result.dateDerniereModification).toBeDefined();
    });

    it("doit retourner les critères et objectifs avec évaluations quand elles existent", async () => {
      // Given
      const critereId = "98ae4279-8bc9-425b-9f33-41cd6698de93";
      const sousCritereId = "f15ad8cd-2718-4e05-878e-238737eb18ea";
      const rattachementCode = "REG-84";
      const objectifId = "6af165bc-54bb-4bce-94d9-8a0f042f3154";
      const ficheEvaluationId = "011aff78-39bb-462f-ae6f-130d4295330c";
      const etapeEvaluationId = "74196334-2da2-4068-a7ca-cc2dfd56fa3d";
      const utilisateurId = "075b92b7-139c-4f2f-a059-530254351fd6";
      const evaluationObjectifId = "c6ae9a92-566e-483f-98ed-352810f769fe";
      const evaluationSousCritereId = "7235a54f-aa0a-490a-8e89-d2fef75bedc3";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère test",
          descriptif: "Description critère test",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère test",
              descriptif: "Description sous-critère test",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement test",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif test",
              descriptif: "Description objectif test",
              jalon: 1,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 1,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      await prisma.evaluation_objectif.create({
        data: {
          id: evaluationObjectifId,
          etape_evaluation_id: etapeEvaluationId,
          objectif_id: objectifId,
          referentiel_objectifId: objectifId,
          auteur_id: utilisateurId,
          note: 4,
          commentaire: "Bon objectif",
        },
      });

      await prisma.evaluation_sous_critere.create({
        data: {
          id: evaluationSousCritereId,
          etape_evaluation_id: etapeEvaluationId,
          sous_critere_id: sousCritereId,
          auteur_id: utilisateurId,
          note: 3,
          commentaire: "Sous-critère acceptable",
        },
      });

      // When
      const result = await query.run({ ficheEvaluationId });

      // Then
      expect(result.criteres).toHaveLength(1);
      expect(result.criteres[0].sousCriteres[0].evaluation).toEqual({
        id: evaluationSousCritereId,
        etape_evaluation_id: etapeEvaluationId,
        sous_critere_id: sousCritereId,
        auteur_id: utilisateurId,
        note: 3,
        commentaire: "Sous-critère acceptable",
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
      expect(result.objectifs).toHaveLength(1);
      expect(result.objectifs[0].evaluation).toEqual({
        id: evaluationObjectifId,
        etape_evaluation_id: etapeEvaluationId,
        objectif_id: objectifId,
        referentiel_objectifId: objectifId,
        auteur_id: utilisateurId,
        note: 4,
        commentaire: "Bon objectif",
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
      expect(result.readOnly).toBe(false);
    });

    it("doit retourner readOnly=true quand l'étape courante n'est pas AUTO_EVALUATION", async () => {
      // Given
      const critereId = "e21aa8c5-24bc-4231-8c39-e8da5431dae9";
      const sousCritereId = "0ab1b63f-2ff6-45e9-835a-ffb51c4fd21b";
      const rattachementCode = "REG-87";
      const objectifId = "9c1ca5fa-d599-4b6d-8e1d-09d1fd993f79";
      const ficheEvaluationId = "8eee737b-b5c0-4fa3-b7c1-f8d8586c83ca";
      const etapeEvaluationId = "53b83d91-646e-4274-b370-a70681723483";

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère read-only",
          descriptif: "Description critère read-only",
          sous_criteres: {
            create: {
              id: sousCritereId,
              libelle: "Sous-critère read-only",
              descriptif: "Description sous-critère read-only",
            },
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement read-only",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif read-only",
              descriptif: "Description objectif read-only",
              jalon: 1,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 1,
          etape_courante: "CONSOLIDATION", // Etape différente
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run({ ficheEvaluationId });

      // Then
      expect(result.readOnly).toBe(true);
    });

    it("doit gérer plusieurs sous-critères par critère", async () => {
      // Given
      const critereId = "43ca597c-0e11-463f-b20c-626d38985111";
      const sousCritere1Id = "4d4777a4-b007-4c38-8828-ceaf12e5805a";
      const sousCritere2Id = "619116c4-e270-457d-a05d-ee3f229c203b";
      const sousCritere3Id = "debfb0d8-9ea6-4f1c-ad2d-102eb5bda14e";
      const rattachementCode = "REG-86";
      const objectifId = "1ae2033e-0036-467c-ab9f-0b98449f68a6";
      const ficheEvaluationId = "00f0584d-18a8-4e4b-a517-23152d6b0ea6";
      const etapeEvaluationId = "963739be-41cc-405d-bb41-48654254d486";

      // Créer le critère avec plusieurs sous-critères
      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère multiple",
          descriptif: "Description critère multiple",
          sous_criteres: {
            create: [
              {
                id: sousCritere1Id,
                libelle: "Sous-critère 1",
                descriptif: "Description 1",
              },
              {
                id: sousCritere2Id,
                libelle: "Sous-critère 2",
                descriptif: "Description 2",
              },
              {
                id: sousCritere3Id,
                libelle: "Sous-critère 3",
                descriptif: "Description 3",
              },
            ],
          },
        },
      });

      // Créer le rattachement avec un objectif
      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement multiple",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif multiple",
              descriptif: "Description objectif multiple",
              jalon: 1,
            },
          },
        },
      });

      // Créer la fiche d'évaluation
      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 1,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run({ ficheEvaluationId });

      // Then
      expect(result.criteres).toHaveLength(1);
      expect(result.criteres[0].sousCriteres).toHaveLength(3);
      expect(result.criteres[0].sousCriteres[0].id).toBe(sousCritere1Id);
      expect(result.criteres[0].sousCriteres[1].id).toBe(sousCritere2Id);
      expect(result.criteres[0].sousCriteres[2].id).toBe(sousCritere3Id);
    });
  });
});
