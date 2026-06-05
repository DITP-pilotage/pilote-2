import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererConversationAdminQuery } from "@/server/albert/queries/RecupererConversationAdminQuery";

describe("RecupererConversationAdminQuery", () => {
  const prismaPilote = new PrismaPilote();
  const buildQuery = () =>
    new RecupererConversationAdminQuery({ prisma: prismaPilote });

  it(
    "renvoie conversation + llm_calls triés par created_at asc",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idConv = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConv,
          utilisateur_id: utilisateur.id,
          titre: "Conv détail",
          messages: [
            { id: "m1", role: "user", parts: [{ type: "text", text: "ping" }] },
          ],
          contexte: { jalon: 2025 },
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "m",
          evaluation: "NEGATIVE",
          commentaire: "réponse hors-sujet",
          created_at: new Date("2026-01-01T10:00:00Z"),
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "m",
          created_at: new Date("2026-01-01T11:00:00Z"),
        },
      });

      // When
      const result = await buildQuery().run({ id: idConv });

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          id: idConv,
          titre: "Conv détail",
          contexte: { jalon: 2025 },
          llmCalls: [
            expect.objectContaining({
              evaluation: "NEGATIVE",
              commentaire: "réponse hors-sujet",
            }),
            expect.objectContaining({ evaluation: null, commentaire: null }),
          ],
        }),
      );
    }),
  );

  it(
    "renvoie null si l'id n'existe pas",
    createIntegrationTest(async () => {
      // When
      const result = await buildQuery().run({ id: randomUUID() });

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "expose les categories_probleme du dernier tour",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idConv = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConv,
          utilisateur_id: utilisateur.id,
          titre: "Conv",
          messages: [],
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
          evaluation: "NEGATIVE",
          commentaire: "bof",
          categories_probleme: ["INCOMPREHENSION", "SUGGESTION"],
        },
      });

      // When
      const detail = await buildQuery().run({ id: idConv });

      // Then
      expect(detail?.llmCalls).toEqual([
        expect.objectContaining({
          evaluation: "NEGATIVE",
          commentaire: "bof",
          categoriesProbleme: ["INCOMPREHENSION", "SUGGESTION"],
        }),
      ]);
    }),
  );
});
