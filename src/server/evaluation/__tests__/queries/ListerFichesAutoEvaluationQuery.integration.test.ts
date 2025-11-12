import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("ListerFichesAutoEvaluationQuery", () => {
  let query: ListerFichesAutoEvaluationQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerFichesAutoEvaluationQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner plusieurs fiches quand l'utilisateur a des permissions sur l'étape AUTO_EVALUATION pour plusieurs rattachements", async () => {
      // Given
      const rattachement1Code = "REG-201";
      const rattachement2Code = "REG-202";
      const utilisateurId = "a551b7e7-9de7-4c32-b5f5-3bbb2c9a875e";
      const ficheEvaluation1Id = "2c9ef6d3-f62b-4101-b740-05a10df40745";
      const ficheEvaluation2Id = "0e09584c-2035-4c32-912b-14ef083da516";
      const etapeEvaluation1Id = "03ac1b13-4d12-422a-9d02-d342173dad8a";
      const etapeEvaluation2Id = "2db36372-2f6f-4168-a6fc-63b40032bcd0";

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

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "d4185625-8c6b-487a-8a53-0b6cd2333a70",
            rattachement_code: rattachement1Code,
            utilisateur_id: utilisateurId,
            etape: "AUTO_EVALUATION",
            jalon: 2025,
          },
          {
            id: "3c422058-43b1-462f-9d90-f80172642917",
            rattachement_code: rattachement2Code,
            utilisateur_id: utilisateurId,
            etape: "AUTO_EVALUATION",
            jalon: 2025,
          },
        ],
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluation1Id,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachement1Code,
          etape_evaluations: {
            create: {
              id: etapeEvaluation1Id,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluation2Id,
          jalon: 2025,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachement2Code,
          etape_evaluations: {
            create: {
              id: etapeEvaluation2Id,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        id: ficheEvaluation1Id,
        etapeCourante: "AUTO_EVALUATION",
        rattachement: {
          code: rattachement1Code,
          libelle: "Rattachement 1",
        },
        objectifs: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        criteres: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        noteCollective: null,
      });
      expect(result).toContainEqual({
        id: ficheEvaluation2Id,
        etapeCourante: "CONSOLIDATION",
        rattachement: {
          code: rattachement2Code,
          libelle: "Rattachement 2",
        },
        objectifs: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        criteres: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        noteCollective: null,
      });
    });

    it("ne doit pas retourner de fiche quand l'utilisateur n'a aucune permission", async () => {
      // Given
      const utilisateurSansPermissionId =
        "63356bc8-7ccf-41a4-9da1-3c23e41ea294";
      const utilisateurAvecPermissionId =
        "8c5e6d1b-0f34-4342-a415-1b039664de98";
      const rattachementCode = "REG-203";
      const ficheEvaluationId = "6bf4064a-ebaa-4032-a95f-6662c664fa67";
      const etapeEvaluationId = "58183d12-a502-4614-b31e-518454b13f34";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurSansPermissionId,
          email: "user-no-perm@example.com",
          nom: "UserNoPermission",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurAvecPermissionId,
          email: "user-with-perm@example.com",
          nom: "UserWithPermission",
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

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "53f87c53-ae66-4af4-a593-d2dec33ac63b",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurAvecPermissionId,
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
      const result = await query.run({
        utilisateurId: utilisateurSansPermissionId,
      });

      // Then
      expect(result).toEqual([]);
    });

    it("ne doit pas retourner de fiche quand l'utilisateur a une permission pour une étape différente", async () => {
      // Given
      const rattachementCode = "REG-204";
      const utilisateurId = "51df456c-fde4-43c7-ad57-e6a62fe8d187";
      const ficheEvaluationId = "37d450e6-ab4b-4b61-b775-75a37f8e0974";
      const etapeEvaluationId = "8ce4537f-5af7-4528-b519-8c8b360abcc3";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user3@example.com",
          nom: "User3",
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

      // User has permission for CONSOLIDATION, not AUTO_EVALUATION
      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "2ee202a8-d500-43fe-aad3-134d27f79661",
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
      const result = await query.run({ utilisateurId });

      // Then
      expect(result).toEqual([]);
    });

    it("doit calculer la note collective à partir des chantiers_evaluation de la dernière date_calcul", async () => {
      // Given
      const rattachementCode = "REG-205";
      const utilisateurId = "f8a7b6c5-4d3e-2f1a-0b9c-8d7e6f5a4b3c";
      const ficheEvaluationId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const etapeEvaluationId = "b2c3d4e5-f6a7-8901-bcde-f12345678901";

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 1",
          },
          {
            id: "CH-002",
            nom: "Chantier 1",
          },
          {
            id: "CH-003",
            nom: "Chantier 1",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-note-collective@example.com",
          nom: "UserNoteCollective",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement avec note collective",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
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

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-001",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 50,
            date_calcul: new Date("2025-01-10"),
            jalon: 2025,
          },
          {
            id: "CH-002",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 60,
            date_calcul: new Date("2025-01-10"),
            jalon: 2025,
          },
          {
            id: "CH-001",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 75.5,
            date_calcul: new Date("2025-01-15"),
            jalon: 2025,
          },
          {
            id: "CH-002",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: 84.5,
            date_calcul: new Date("2025-01-15"),
            jalon: 2025,
          },
          {
            id: "CH-003",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-1",
            taux_avancement: null,
            date_calcul: new Date("2025-01-15"),
            jalon: 2025,
          },
        ],
      });

      // When
      const result = await query.run({ utilisateurId });

      // Then
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: ficheEvaluationId,
        etapeCourante: "AUTO_EVALUATION",
        rattachement: {
          code: rattachementCode,
          libelle: "Rattachement avec note collective",
        },
        objectifs: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        criteres: {
          moyenne: null,
          nombreNotes: 0,
          nombreTotal: 0,
        },
        noteCollective: 80,
      });
    });
  });
});
