import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import { ExporterDerniereReponseUseCase } from "@/server/albert/usecases/ExporterDerniereReponseUseCase";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";

const buildConversation = (
  overrides: Partial<ChatConversation> = {},
): ChatConversation => ({
  id: "conv-1",
  utilisateurId: "user-1",
  titre: "Conversation test",
  contexte: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  messages: [
    {
      id: "msg-assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "## Synthèse\n\nUn paragraphe simple." }],
    },
  ] as ChatConversation["messages"],
  ...overrides,
});

describe("ExporterDerniereReponseUseCase execute", () => {
  test("génère un PDF à partir du texte exact du message assistant", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat.statut).toBe("ok");
    if (resultat.statut !== "ok") throw new Error("statut inattendu");
    expect(Buffer.isBuffer(resultat.buffer)).toBe(true);
    expect(resultat.buffer.toString("latin1", 0, 5)).toBe("%PDF-");
    expect(resultat.filename).toBe("reponse-albert-msg-asse.pdf");
  });

  test("retente jusqu'à 3 fois si la conversation n'est pas encore persistée, puis réussit", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat.statut).toBe("ok");
    expect(repository.recupererParId).toHaveBeenCalledTimes(3);
  });

  test("retourne conversation_introuvable après 3 tentatives infructueuses", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(null);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-inconnue",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "conversation_introuvable" });
    expect(repository.recupererParId).toHaveBeenCalledTimes(3);
  });

  test("retourne message_introuvable si l'id du message n'existe pas dans la conversation", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-inexistant",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_introuvable" });
  });

  test("retourne message_invalide si le message ciblé n'est pas un message assistant", async () => {
    // Given
    const conversation = buildConversation({
      messages: [
        { id: "msg-user-1", role: "user", parts: [{ type: "text", text: "Salut" }] },
      ] as ChatConversation["messages"],
    });
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(conversation);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-user-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_invalide" });
  });

  test("retourne message_invalide si le message assistant n'a aucun texte", async () => {
    // Given
    const conversation = buildConversation({
      messages: [
        { id: "msg-assistant-2", role: "assistant", parts: [] },
      ] as ChatConversation["messages"],
    });
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(conversation);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-2",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_invalide" });
  });
});
