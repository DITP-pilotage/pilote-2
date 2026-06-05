import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";

describe("EvaluerChatUseCase", () => {
  const prismaPilote = new PrismaPilote();
  const buildUseCase = () => new EvaluerChatUseCase({ prisma: prismaPilote });

  it(
    "enregistre une évaluation négative avec catégories et commentaire sur le dernier tour",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const chatId = randomUUID();
      await tx.llm_calls.create({
        data: {
          chat_id: chatId,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
        },
      });

      // When
      await buildUseCase().execute({
        chatId,
        evaluation: "NEGATIVE",
        categories: ["PROBLEME_TECHNIQUE", "AUTRE"],
        commentaire: "ça plante",
      });

      // Then
      const ligne = await tx.llm_calls.findFirst({
        where: { chat_id: chatId },
      });
      expect(ligne).toEqual(
        expect.objectContaining({
          evaluation: "NEGATIVE",
          commentaire: "ça plante",
          categories_probleme: ["PROBLEME_TECHNIQUE", "AUTRE"],
        }),
      );
    }),
  );

  it(
    "enregistre une évaluation positive avec commentaire et sans catégorie",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const chatId = randomUUID();
      await tx.llm_calls.create({
        data: {
          chat_id: chatId,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
        },
      });

      // When
      await buildUseCase().execute({
        chatId,
        evaluation: "POSITIVE",
        commentaire: "très clair",
      });

      // Then
      const ligne = await tx.llm_calls.findFirst({
        where: { chat_id: chatId },
      });
      expect(ligne).toEqual(
        expect.objectContaining({
          evaluation: "POSITIVE",
          commentaire: "très clair",
          categories_probleme: [],
        }),
      );
    }),
  );
});
