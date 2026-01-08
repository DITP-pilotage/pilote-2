import { $Enums } from "@prisma/client";
import { mock, MockProxy } from "jest-mock-extended";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { TransmettreAppreciationHandler } from "@/server/evaluation/handlers/TransmettreAppreciationHandler";
import { NotificationEmailService } from "@/server/evaluation/services/NotificationEmailService";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("TransmettreAppreciationHandler", () => {
  let handler: TransmettreAppreciationHandler;
  let notificationEmailService: MockProxy<NotificationEmailService>;
  const prismaPilote = new PrismaPilote();
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    notificationEmailService = mock<NotificationEmailService>();
    handler = new TransmettreAppreciationHandler({
      prisma: prismaPilote,
      transaction,
      notificationEmailService,
    });
  });

  describe("#execute", () => {
    it(
      "doit permettre à un utilisateur de transmettre uniquement les fiches pour lesquelles il a accès en CONSOLIDATION",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();
        const rattachement3 = await fixtures.rattachement();

        // Utilisateur has access to rattachement1 and rattachement2, but NOT rattachement3
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche1 = await fixtures.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const fiche2 = await fixtures.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const fiche3 = await fixtures.fiche({
          rattachement_code: rattachement3.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const etape1 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });
        const etape2 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });
        const etape3 = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche3.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id, fiche3.id],
          utilisateurId: utilisateur.id,
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

        expect(etape1Updated?.read_only).toBe(true);
        expect(etape2Updated?.read_only).toBe(true);
        expect(etape3Updated?.read_only).toBe(false);
      }),
    );

    it(
      "ne doit modifier que l'étape CONSOLIDATION et pas les autres étapes",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();

        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const etapeAuto = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          read_only: true,
        });
        const etapeConso = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });
        const etapeInstruction = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.INSTRUCTION,
          read_only: true,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
          utilisateurId: utilisateur.id,
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
        expect(etapeConsoUpdated?.read_only).toBe(true);
        expect(etapeInstructionUpdated?.read_only).toBe(true);
      }),
    );

    it(
      "lors du blocage de fiches doit envoyer un email de notification aux utilisateurs rattachés à l'étape de consolidation",
      createIntegrationTest(async () => {
        // Given
        const utilisateurTransmetteur = await fixtures.utilisateur({
          email: "transmetteur@example.com",
        });
        const utilisateurNotifie = await fixtures.utilisateur({
          email: "notifie@example.com",
        });

        const rattachement1 = await fixtures.rattachement();
        const rattachement2 = await fixtures.rattachement();

        // utilisateurTransmetteur has access to both rattachements
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateurTransmetteur.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateurTransmetteur.id,
          rattachement_code: rattachement2.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        // utilisateurNotifie has access only to rattachement1
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateurNotifie.id,
          rattachement_code: rattachement1.code,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const fiche1 = await fixtures.fiche({
          rattachement_code: rattachement1.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });
        const fiche2 = await fixtures.fiche({
          rattachement_code: rattachement2.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche1.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });
        await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche2.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche1.id, fiche2.id],
          utilisateurId: utilisateurTransmetteur.id,
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
      }),
    );

    it(
      "ne doit pas permettre à un utilisateur avec accès à une autre étape de modifier les fiches",
      createIntegrationTest(async (tx) => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rattachement = await fixtures.rattachement();

        // User has access to AUTO_EVALUATION, NOT CONSOLIDATION
        await fixtures.rattachementUtilisateurEtapeJalon({
          utilisateur_id: utilisateur.id,
          rattachement_code: rattachement.code,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        });

        const fiche = await fixtures.fiche({
          rattachement_code: rattachement.code,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
        });

        const etape = await fixtures.etapeEvaluation({
          fiche_evaluation_id: fiche.id,
          type: $Enums.etape_evaluation_enum.CONSOLIDATION,
          read_only: false,
        });

        // When
        await handler.execute({
          ficheEvaluationIds: [fiche.id],
          utilisateurId: utilisateur.id,
        });

        // Then
        const etapeUpdated = await tx.etape_evaluation.findUnique({
          where: { id: etape.id },
        });

        expect(etapeUpdated?.read_only).toBe(false);
      }),
    );
  });
});
