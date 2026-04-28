import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";
import { EnregistrerConversationUseCase } from "@/server/albert/usecases/EnregistrerConversationUseCase";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("EnregistrerConversationUseCase", () => {
  const prismaPilote = new PrismaPilote();

  const buildUseCase = () =>
    new EnregistrerConversationUseCase({
      chatConversationRepository: new PrismaChatConversationRepository({
        prisma: prismaPilote,
      }),
    });

  it(
    "ne fait rien si la liste de messages est vide",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const useCase = buildUseCase();
      const id = randomUUID();

      // When
      await useCase.execute({
        id,
        utilisateurId: utilisateur.id,
        messages: [],
        contexte: null,
      });

      // Then
      const repository = new PrismaChatConversationRepository({
        prisma: prismaPilote,
      });
      expect(
        await repository.recupererParId({
          id,
          utilisateurId: utilisateur.id,
        }),
      ).toBeNull();
    }),
  );

  it(
    "persiste la conversation avec un titre dérivé du premier message user (tronqué à 80 caractères)",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const useCase = buildUseCase();
      const repository = new PrismaChatConversationRepository({
        prisma: prismaPilote,
      });
      const id = randomUUID();
      const texteLong = "a".repeat(120);
      const messages = [
        { id: "m1", role: "user", parts: [{ type: "text", text: texteLong }] },
      ] as unknown as PiloteUIMessage[];

      // When
      await useCase.execute({
        id,
        utilisateurId: utilisateur.id,
        messages,
        contexte: { jalon: 2025, territoireCode: "REG-53" },
      });

      // Then
      const conversation = await repository.recupererParId({
        id,
        utilisateurId: utilisateur.id,
      });
      expect(conversation).toEqual({
        id,
        utilisateurId: utilisateur.id,
        titre: `${"a".repeat(79)}…`,
        messages,
        contexte: { jalon: 2025, territoireCode: "REG-53" },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    }),
  );
});
