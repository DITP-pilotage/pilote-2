import {
  writeMinimizedConversation,
  clearMinimizedConversation,
  readMinimizedConversation,
} from "@/components/_commons/ChatUI/minimizedConversationStorage";

const conversation = {
  id: "0199a1ce-0000-7000-8000-000000000001",
  agentContext: {
    territoireCode: "NAT-FR",
    jalon: 2025,
    instructions: "Contexte",
  },
};

describe("minimizedConversationStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("relit ce qui a été écrit", () => {
    // Given
    writeMinimizedConversation(conversation);

    // When
    const readBack = readMinimizedConversation();

    // Then
    expect(readBack).toStrictEqual(conversation);
  });

  test("retourne null quand rien n'a été écrit", () => {
    // When
    const readBack = readMinimizedConversation();

    // Then
    expect(readBack).toBeNull();
  });

  test("retourne null et nettoie quand le contenu stocké est invalide", () => {
    // Given
    sessionStorage.setItem("albert:conversation", '{"id":"pas-un-uuid"}');

    // When
    const readBack = readMinimizedConversation();

    // Then
    expect(readBack).toBeNull();
    expect(sessionStorage.getItem("albert:conversation")).toBeNull();
  });

  test("efface l'entrée", () => {
    // Given
    writeMinimizedConversation(conversation);

    // When
    clearMinimizedConversation();

    // Then
    expect(readMinimizedConversation()).toBeNull();
  });
});
