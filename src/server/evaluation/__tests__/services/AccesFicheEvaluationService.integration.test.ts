import { AccesFicheEvaluationService } from "@/server/evaluation/services/AccesFicheEvaluationService";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("AccesFicheEvaluationService", () => {
  let service: AccesFicheEvaluationService;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    service = new AccesFicheEvaluationService({ prisma: prismaPilote });
  });

  describe("peutAccederEtapeAutoEvaluation", () => {
    it("doit retourner true quand l'utilisateur a la permission pour l'étape AUTO_EVALUATION", async () => {
      // Given
      const rattachementCode = "REG-300";
      const utilisateurId = "6429fbb5-c4c3-4e98-a729-f35ab37ea512";
      const ficheEvaluationId = "b16f139e-3429-48c7-b9fb-998ea4f23bfa";
      const etapeEvaluationId = "61398e79-c604-4527-b5b7-970b6b981e10";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user1@example.com",
          nom: "User1",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec permission",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "AUTO_EVALUATION",
          jalon: 2025,
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
      const result = await service.peutAccederEtapeAutoEvaluation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(true);
    });

    it("doit retourner false quand l'utilisateur n'a aucune permission", async () => {
      // Given
      const rattachementCode = "REG-301";
      const utilisateurId = "1a632394-370b-4330-b5ec-dee666abaea2";
      const ficheEvaluationId = "aae0716e-f616-4ef8-a3ec-65141fd7ba86";
      const etapeEvaluationId = "4ddd1d5d-0a5e-485b-a022-f514bdcbc283";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-no-perm@example.com",
          nom: "UserNoPermission",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement réservé",
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
      const result = await service.peutAccederEtapeAutoEvaluation({
        utilisateurId: utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });

    it("doit retourner false quand l'utilisateur a une permission pour une étape différente", async () => {
      // Given
      const rattachementCode = "REG-302";
      const utilisateurId = "e5e06dd2-b30f-4022-acfe-94bd80f6733c";
      const ficheEvaluationId = "9be74402-eb4e-4133-b952-fedafbb486ea";
      const etapeEvaluationId = "6ac60dc9-c26c-477f-b352-bc0b9124f53e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user2@example.com",
          nom: "User2",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement consolidation",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "e7222f87-cdd8-457d-b131-515d8e40cb20",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION", // Mauvais étape
          jalon: 2025,
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
      const result = await service.peutAccederEtapeAutoEvaluation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });

    it("doit retourner false quand l'utilisateur a une permission pour un rattachement différent", async () => {
      // Given
      const rattachement1Code = "REG-305";
      const rattachement2Code = "REG-306";
      const utilisateurId = "10f709ef-f0c1-4f5e-9604-68db8b36e093";
      const ficheEvaluationId = "3282be13-e59e-4668-8dc7-03e31f5c4a42";
      const etapeEvaluationId = "6f167ae9-2094-4f85-a59a-0029c655927b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user4@example.com",
          nom: "User4",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement1Code,
          libelle: "Rattachement 1",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement2Code,
          libelle: "Rattachement 2",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "5cea8480-c4ab-4fec-b99d-5881fe207f39",
          rattachement_code: rattachement1Code,
          utilisateur_id: utilisateurId,
          etape: "AUTO_EVALUATION",
          jalon: 2025,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement2Code,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await service.peutAccederEtapeAutoEvaluation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });
  });

  describe("peutAccederEtapeConsolidation", () => {
    it("doit retourner true quand l'utilisateur a la permission pour l'étape CONSOLIDATION", async () => {
      // Given
      const rattachementCode = "REG-300";
      const utilisateurId = "6429fbb5-c4c3-4e98-a729-f35ab37ea512";
      const ficheEvaluationId = "b16f139e-3429-48c7-b9fb-998ea4f23bfa";
      const etapeEvaluationId = "61398e79-c604-4527-b5b7-970b6b981e10";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user1@example.com",
          nom: "User1",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec permission",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
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
      const result = await service.peutAccederEtapeConsolidation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(true);
    });

    it("doit retourner false quand l'utilisateur n'a aucune permission", async () => {
      // Given
      const rattachementCode = "REG-301";
      const utilisateurId = "1a632394-370b-4330-b5ec-dee666abaea2";
      const ficheEvaluationId = "aae0716e-f616-4ef8-a3ec-65141fd7ba86";
      const etapeEvaluationId = "4ddd1d5d-0a5e-485b-a022-f514bdcbc283";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-no-perm@example.com",
          nom: "UserNoPermission",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement réservé",
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
      const result = await service.peutAccederEtapeConsolidation({
        utilisateurId: utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });

    it("doit retourner false quand l'utilisateur a une permission pour une étape différente", async () => {
      // Given
      const rattachementCode = "REG-302";
      const utilisateurId = "e5e06dd2-b30f-4022-acfe-94bd80f6733c";
      const ficheEvaluationId = "9be74402-eb4e-4133-b952-fedafbb486ea";
      const etapeEvaluationId = "6ac60dc9-c26c-477f-b352-bc0b9124f53e";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user2@example.com",
          nom: "User2",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement auto évaluation",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "e7222f87-cdd8-457d-b131-515d8e40cb20",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: "AUTO_EVALUATION", // Mauvais étape
          jalon: 2025,
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
      const result = await service.peutAccederEtapeConsolidation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });

    it("doit retourner false quand l'utilisateur a une permission pour un rattachement différent", async () => {
      // Given
      const rattachement1Code = "REG-305";
      const rattachement2Code = "REG-306";
      const utilisateurId = "10f709ef-f0c1-4f5e-9604-68db8b36e093";
      const ficheEvaluationId = "3282be13-e59e-4668-8dc7-03e31f5c4a42";
      const etapeEvaluationId = "6f167ae9-2094-4f85-a59a-0029c655927b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user4@example.com",
          nom: "User4",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement1Code,
          libelle: "Rattachement 1",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement2Code,
          libelle: "Rattachement 2",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "5cea8480-c4ab-4fec-b99d-5881fe207f39",
          rattachement_code: rattachement1Code,
          utilisateur_id: utilisateurId,
          etape: "CONSOLIDATION",
          jalon: 2025,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement2Code,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "CONSOLIDATION",
            },
          },
        },
      });

      // When
      const result = await service.peutAccederEtapeConsolidation({
        utilisateurId,
        ficheEvaluationId,
      });

      // Then
      expect(result).toBe(false);
    });
  });
});
