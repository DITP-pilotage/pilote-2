import { $Enums } from "@prisma/client";
import { mock, MockProxy } from "jest-mock-extended";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";
import { TransmettreAppreciationHandler } from "@/server/evaluation/handlers/TransmettreAppreciationHandler";
import { NotificationEmailService } from "@/server/evaluation/services/NotificationEmailService";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("TransmettreAppreciationHandler", () => {
  let handler: TransmettreAppreciationHandler;
  let notificationEmailService: MockProxy<NotificationEmailService>;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    notificationEmailService = mock<NotificationEmailService>();
    handler = new TransmettreAppreciationHandler({
      prisma: prismaPilote,
      transaction,
      notificationEmailService,
    });
  });

  describe("#execute", () => {
    it("doit permettre à un utilisateur de transmettre uniquement les fiches pour lesquelles il a accès en CONSOLIDATION", async () => {
      // Given
      const utilisateurId = "a1b2c3d4-e5f6-7890-abcd-111111111111";
      const rattachement1Code = "DEPT-SECURE-01";
      const rattachement2Code = "DEPT-SECURE-02";
      const rattachement3Code = "DEPT-SECURE-03";

      const fiche1Id = "b1c2d3e4-f5a6-7890-bcde-111111111111";
      const fiche2Id = "b1c2d3e4-f5a6-7890-bcde-222222222222";
      const fiche3Id = "b1c2d3e4-f5a6-7890-bcde-333333333333";

      const etape1Id = "c1d2e3f4-a5b6-7890-cdef-111111111111";
      const etape2Id = "c1d2e3f4-a5b6-7890-cdef-222222222222";
      const etape3Id = "c1d2e3f4-a5b6-7890-cdef-333333333333";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user@example.com",
          nom: "Test",
          prenom: "User",
          fonction: "Fonction",
          date_creation: new Date().toISOString(),
          profilCode: ProfilEnum.DITP_ADMIN,
        },
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachement1Code,
            libelle: "Rattachement accessible 1",
            groupe: rattachement1Code,
            ordre: 1,
          },
          {
            code: rattachement2Code,
            libelle: "Rattachement accessible 2",
            groupe: rattachement2Code,
            ordre: 1,
          },
          {
            code: rattachement3Code,
            libelle: "Rattachement non accessible",
            groupe: rattachement3Code,
            ordre: 1,
          },
        ],
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "d1e2f3a4-b5c6-7890-defa-111111111111",
            utilisateur_id: utilisateurId,
            rattachement_code: rattachement1Code,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
          {
            id: "d1e2f3a4-b5c6-7890-defa-222222222222",
            utilisateur_id: utilisateurId,
            rattachement_code: rattachement2Code,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement3Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape3Id,
            fiche_evaluation_id: fiche3Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        ],
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [fiche1Id, fiche2Id, fiche3Id],
        utilisateurId,
      });

      // Then
      const etape1Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape1Id },
      });
      const etape2Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape2Id },
      });
      const etape3Updated = await prisma.etape_evaluation.findUnique({
        where: { id: etape3Id },
      });

      expect(etape1Updated?.read_only).toBe(true);
      expect(etape2Updated?.read_only).toBe(true);
      expect(etape3Updated?.read_only).toBe(false);
    });

    it("ne doit modifier que l'étape CONSOLIDATION et pas les autres étapes", async () => {
      // Given
      const utilisateurId = "c4d5e6f7-a8b9-0123-cdef-111111111111";
      const rattachementCode = "DEPT-MULTI-01";
      const ficheEvaluationId = "d5e6f7a8-b9c0-1234-def0-111111111111";

      const etapeAutoId = "e6f7a8b9-c0d1-2345-ef01-111111111111";
      const etapeConsoId = "e6f7a8b9-c0d1-2345-ef01-222222222222";
      const etapeInstructionId = "e6f7a8b9-c0d1-2345-ef01-333333333333";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "multi@example.com",
          nom: "Multi",
          prenom: "User",
          fonction: "Fonction",
          date_creation: new Date().toISOString(),
          profilCode: ProfilEnum.DITP_ADMIN,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement multi-étapes",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "f7a8b9c0-d1e2-3456-f012-111111111111",
          utilisateur_id: utilisateurId,
          rattachement_code: rattachementCode,
          jalon: 2025,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoId,
                type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                read_only: true,
              },
              {
                id: etapeConsoId,
                type: $Enums.etape_evaluation_enum.CONSOLIDATION,
                read_only: false,
              },
              {
                id: etapeInstructionId,
                type: $Enums.etape_evaluation_enum.INSTRUCTION,
                read_only: true,
              },
            ],
          },
        },
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [ficheEvaluationId],
        utilisateurId,
      });

      // Then
      const etapeAuto = await prisma.etape_evaluation.findUnique({
        where: { id: etapeAutoId },
      });
      const etapeConso = await prisma.etape_evaluation.findUnique({
        where: { id: etapeConsoId },
      });
      const etapeInstruction = await prisma.etape_evaluation.findUnique({
        where: { id: etapeInstructionId },
      });

      expect(etapeAuto?.read_only).toBe(true);
      expect(etapeConso?.read_only).toBe(true);
      expect(etapeInstruction?.read_only).toBe(true);
    });

    it("lors du blocage de fiches doit envoyer un email de notification aux utilisateurs rattachés à l'étape de consolidation", async () => {
      // Given
      const utilisateurTransmetteurId = "a8b9c0d1-e2f3-4567-0123-111111111111";
      const utilisateurNotifieId = "a8b9c0d1-e2f3-4567-0123-222222222222";

      const rattachement1Code = "DEPT-NOTIF-01";
      const rattachement2Code = "DEPT-NOTIF-02";

      const fiche1Id = "b9c0d1e2-f3a4-5678-0123-111111111111";
      const fiche2Id = "b9c0d1e2-f3a4-5678-0123-222222222222";

      const etape1Id = "c0d1e2f3-a4b5-6789-0123-111111111111";
      const etape2Id = "c0d1e2f3-a4b5-6789-0123-222222222222";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurTransmetteurId,
            email: "transmetteur@example.com",
            nom: "Transmetteur",
            prenom: "User",
            fonction: "Fonction",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            id: utilisateurNotifieId,
            email: "notifie@example.com",
            nom: "Notifié",
            prenom: "User",
            fonction: "Fonction",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
        ],
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachement1Code,
            libelle: "Rattachement avec notification 1",
            groupe: rattachement1Code,
            ordre: 1,
          },
          {
            code: rattachement2Code,
            libelle: "Rattachement avec notification 2",
            groupe: rattachement2Code,
            ordre: 1,
          },
        ],
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "d1e2f3a4-b5c6-7890-0123-111111111111",
            utilisateur_id: utilisateurTransmetteurId,
            rattachement_code: rattachement1Code,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
          {
            id: "d1e2f3a4-b5c6-7890-0123-222222222222",
            utilisateur_id: utilisateurTransmetteurId,
            rattachement_code: rattachement2Code,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
          {
            id: "d1e2f3a4-b5c6-7890-0123-333333333333",
            utilisateur_id: utilisateurNotifieId,
            rattachement_code: rattachement1Code,
            jalon: 2025,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
            rattachement_code: rattachement2Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etape1Id,
            fiche_evaluation_id: fiche1Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
          {
            id: etape2Id,
            fiche_evaluation_id: fiche2Id,
            type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            read_only: false,
          },
        ],
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [fiche1Id, fiche2Id],
        utilisateurId: utilisateurTransmetteurId,
      });

      // Then
      expect(notificationEmailService.execute).toHaveBeenCalledTimes(2);
      expect(notificationEmailService.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          destinataires: [{ email: "transmetteur@example.com" }],
          templateId: 56,
        }),
      );
      expect(notificationEmailService.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          destinataires: [{ email: "notifie@example.com" }],
          templateId: 56,
        }),
      );
    });

    it("ne doit pas permettre à un utilisateur avec accès à une autre étape de modifier les fiches", async () => {
      // Given
      const utilisateurId = "c6d7e8f9-a0b1-2345-6789-111111111111";
      const rattachementCode = "DEPT-OTHER-ETAPE-01";
      const ficheId = "d7e8f9a0-b1c2-3456-789a-111111111111";
      const etapeId = "e8f9a0b1-c2d3-4567-89ab-111111111111";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "other-etape@example.com",
          nom: "OtherEtape",
          prenom: "User",
          fonction: "Fonction",
          date_creation: new Date().toISOString(),
          profilCode: ProfilEnum.DITP_ADMIN,
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          libelle: "Rattachement autre étape",
          groupe: rattachementCode,
          ordre: 1,
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "f9a0b1c2-d3e4-5678-9abc-111111111111",
          utilisateur_id: utilisateurId,
          rattachement_code: rattachementCode,
          jalon: 2025,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeId,
              type: $Enums.etape_evaluation_enum.CONSOLIDATION,
              read_only: false,
            },
          },
        },
      });

      // When
      await handler.execute({
        ficheEvaluationIds: [ficheId],
        utilisateurId,
      });

      // Then
      const etapeUpdated = await prisma.etape_evaluation.findUnique({
        where: { id: etapeId },
      });

      expect(etapeUpdated?.read_only).toBe(false);
    });
  });
});
