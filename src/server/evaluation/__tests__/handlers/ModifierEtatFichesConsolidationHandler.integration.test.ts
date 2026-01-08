import { $Enums } from "@prisma/client";
import { mock, MockProxy } from "jest-mock-extended";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { ModifierEtatFichesConsolidationHandler } from "@/server/evaluation/handlers/ModifierEtatFichesConsolidationHandler";
import { NotificationEmailService } from "@/server/evaluation/services/NotificationEmailService";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ModifierEtatFichesConsolidationHandler", () => {
  let handler: ModifierEtatFichesConsolidationHandler;
  let notificationEmailService: MockProxy<NotificationEmailService>;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    notificationEmailService = mock<NotificationEmailService>();
    handler = new ModifierEtatFichesConsolidationHandler({
      prisma: prismaPilote,
      transaction,
      notificationEmailService,
    });
  });

  describe("#execute", () => {
    it(
      "doit débloquer plusieurs fiches consolidation en une seule opération",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche1 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche3 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche4 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche5 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        const etape1 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etape2 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etape3 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        const etape4 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche4.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etape5 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche5.id,
          type: "INSTRUCTION",
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id, fiche3.id, fiche5.id],
          readOnly: false,
        });

        // Then
        const etape1Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape1.id },
        });
        const etape2Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape2.id },
        });
        const etape3Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape3.id },
        });
        const etape4Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape4.id },
        });
        const etape5Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape5.id },
        });

        expect(etape1Updated?.read_only).toBe(false);
        expect(etape2Updated?.read_only).toBe(false);
        expect(etape3Updated?.read_only).toBe(false);
        expect(etape4Updated?.read_only).toBe(true);
        expect(etape5Updated?.read_only).toBe(true);
      }),
    );

    it(
      "doit bloquer plusieurs fiches consolidation en une seule opération",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche1 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche2 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche3 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche4 = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const fiche5 = await fixtures.fiche({
          etape_courante: "INSTRUCTION",
        });

        const etape1 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        const etape2 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        const etape3 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etape4 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche4.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        const etape5 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche5.id,
          type: "INSTRUCTION",
          read_only: false,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id, fiche3.id, fiche5.id],
          readOnly: true,
        });

        // Then
        const etape1Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape1.id },
        });
        const etape2Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape2.id },
        });
        const etape3Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape3.id },
        });
        const etape4Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape4.id },
        });
        const etape5Updated = await tx.etape_evaluation.findUnique({
          where: { id: etape5.id },
        });

        expect(etape1Updated?.read_only).toBe(true);
        expect(etape2Updated?.read_only).toBe(true);
        expect(etape3Updated?.read_only).toBe(true);
        expect(etape4Updated?.read_only).toBe(false);
        expect(etape5Updated?.read_only).toBe(false);
      }),
    );

    it(
      "ne doit modifier que l'étape CONSOLIDATION et pas les autres étapes",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });

        const etapeAuto = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "AUTO_EVALUATION",
          read_only: true,
        });
        const etapeConso = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
        });
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "INSTRUCTION",
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
          readOnly: false,
        });

        // Then
        const etapeAutoUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeAuto.id },
        });
        const etapeConsoUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeConso.id },
        });
        const etapeInstructionUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeInstruction.id },
        });

        expect(etapeAutoUpdated?.read_only).toBe(true);
        expect(etapeConsoUpdated?.read_only).toBe(false);
        expect(etapeInstructionUpdated?.read_only).toBe(true);
      }),
    );

    it(
      "ne doit rien faire si la liste de fiches est vide",
      createIntegrationTest(async (tx) => {
        // Given
        const fiche = await fixtures.fiche({
          etape_courante: "CONSOLIDATION",
        });
        const etapeConso = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [],
          readOnly: false,
        });

        // Then
        const etapeConsoUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etapeConso.id },
        });

        expect(etapeConsoUpdated?.read_only).toBe(true);
      }),
    );

    it(
      "Lors du blocage de fiches doit envoyer un email de notification aux utilisateurs rattachés à l'étape de consolidation pour le rattachement",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur1 = await fixtures.utilisateur({
          email: "notif1@example.com",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const utilisateur2 = await fixtures.utilisateur({
          email: "notif2@example.com",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const utilisateur3 = await fixtures.utilisateur({
          email: "notif3@example.com",
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const utilisateur4 = await fixtures.utilisateur({
          email: "notif4@example.com",
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        const rattachement1 = await fixtures.rattachement({
          code: "DEPT-01",
          libelle: "Rattachement1",
        });
        const rattachement2 = await fixtures.rattachement({
          code: "REG-02",
          libelle: "Rattachement2",
        });
        const rattachement3 = await fixtures.rattachement({
          code: "DEPT-03",
          libelle: "Rattachement3",
        });

        const fiche1 = await fixtures.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: "CONSOLIDATION",
        });
        const fiche2 = await fixtures.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: "CONSOLIDATION",
        });
        const fiche3 = await fixtures.fiche({
          rattachement_code: rattachement3.code,
          etape_courante: "AUTO_EVALUATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: "CONSOLIDATION",
          read_only: false,
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: "AUTO_EVALUATION",
          read_only: false,
        });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur1.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur2.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur3.id,
          rattachement_code: rattachement3.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur4.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur2.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id],
          readOnly: true,
        });

        // Then
        expect(notificationEmailService.execute).toHaveBeenCalledTimes(2);
        expect(notificationEmailService.execute).toHaveBeenNthCalledWith(1, {
          destinataires: [{ email: "notif1@example.com" }],
          params: {
            listeTerritoires: ["01 - Rattachement1"],
          },
          templateId: 56,
        });
        expect(notificationEmailService.execute).toHaveBeenNthCalledWith(2, {
          destinataires: [{ email: "notif2@example.com" }],
          params: {
            listeTerritoires: ["01 - Rattachement1", "Région Rattachement2"],
          },
          templateId: 56,
        });
      }),
    );

    it(
      "ne doit pas envoyer d'email de notification lors du déblocage de fiches",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });

        const rattachement = await fixtures.rattachement();

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: "CONSOLIDATION",
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: "CONSOLIDATION",
          read_only: true,
        });

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
          readOnly: false,
        });

        // Then
        expect(notificationEmailService.execute).not.toHaveBeenCalled();
      }),
    );
  });
});
