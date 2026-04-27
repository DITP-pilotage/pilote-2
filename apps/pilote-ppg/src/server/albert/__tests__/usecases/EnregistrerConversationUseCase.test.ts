import { EnregistrerConversationUseCase } from "@/server/albert/usecases/EnregistrerConversationUseCase";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("EnregistrerConversationUseCase", () => {
  it("ne fait rien si la liste de messages est vide", async () => {
    // Given
    const upsert = vi.fn();
    const repository = { upsert } as unknown as ChatConversationRepository;
    const useCase = new EnregistrerConversationUseCase({
      chatConversationRepository: repository,
    });

    // When
    await useCase.execute({
      id: "conv-1",
      utilisateurId: "user-1",
      messages: [],
      territoireCode: null,
      jalon: null,
    });

    // Then
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upsert avec un titre dérivé du premier message user (tronqué à 80 caractères)", async () => {
    // Given
    const upsert = vi.fn();
    const repository = { upsert } as unknown as ChatConversationRepository;
    const useCase = new EnregistrerConversationUseCase({
      chatConversationRepository: repository,
    });
    const texteLong = "a".repeat(120);
    const messages = [
      {
        id: "m1",
        role: "user",
        parts: [{ type: "text", text: texteLong }],
      },
    ] as unknown as PiloteUIMessage[];

    // When
    await useCase.execute({
      id: "conv-1",
      utilisateurId: "user-1",
      messages,
      territoireCode: "REG-53",
      jalon: 2025,
    });

    // Then
    expect(upsert).toHaveBeenCalledWith({
      id: "conv-1",
      utilisateurId: "user-1",
      titre: `${"a".repeat(79)}…`,
      messages,
      territoireCode: "REG-53",
      jalon: 2025,
    });
  });
});
