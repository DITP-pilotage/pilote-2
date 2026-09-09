import {
  ecrireConversationMinimisee,
  effacerConversationMinimisee,
  lireConversationMinimisee,
} from "@/components/_commons/ChatUI/conversationMinimiseeStockage";

const conversation = {
  id: "0199a1ce-0000-7000-8000-000000000001",
  agentContext: {
    territoireCode: "NAT-FR",
    jalon: 2025,
    instructions: "Contexte",
  },
};

describe("conversationMinimiseeStockage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("relit ce qui a été écrit", () => {
    // Given
    ecrireConversationMinimisee(conversation);

    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toStrictEqual(conversation);
  });

  test("retourne null quand rien n'a été écrit", () => {
    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toBeNull();
  });

  test("retourne null et nettoie quand le contenu stocké est invalide", () => {
    // Given
    sessionStorage.setItem("albert:conversation", '{"id":"pas-un-uuid"}');

    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toBeNull();
    expect(sessionStorage.getItem("albert:conversation")).toBeNull();
  });

  test("efface l'entrée", () => {
    // Given
    ecrireConversationMinimisee(conversation);

    // When
    effacerConversationMinimisee();

    // Then
    expect(lireConversationMinimisee()).toBeNull();
  });
});
