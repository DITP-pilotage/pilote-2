import {
  formaterDateConversation,
  grouperConversationsParPeriode,
} from "@/components/_commons/ChatUI/grouperConversationsParPeriode";

const maintenant = new Date("2026-09-09T14:30:00");

describe("grouperConversationsParPeriode", () => {
  test("répartit les conversations entre aujourd'hui, cette semaine et plus ancien", () => {
    // Given
    const conversations = [
      { id: "a", updatedAt: new Date("2026-09-09T09:41:00") },
      { id: "b", updatedAt: new Date("2026-09-08T16:20:00") },
      { id: "c", updatedAt: new Date("2026-09-03T08:00:00") },
      { id: "d", updatedAt: new Date("2026-08-12T08:00:00") },
    ];

    // When
    const groupes = grouperConversationsParPeriode({
      conversations,
      maintenant,
    });

    // Then
    expect(groupes).toEqual([
      { libelle: "Aujourd'hui", conversations: [conversations[0]] },
      {
        libelle: "Cette semaine",
        conversations: [conversations[1], conversations[2]],
      },
      { libelle: "Plus ancien", conversations: [conversations[3]] },
    ]);
  });

  test("omet les périodes vides", () => {
    // Given
    const conversations = [
      { id: "d", updatedAt: new Date("2026-08-12T08:00:00") },
    ];

    // When
    const groupes = grouperConversationsParPeriode({
      conversations,
      maintenant,
    });

    // Then
    expect(groupes).toEqual([
      { libelle: "Plus ancien", conversations: [conversations[0]] },
    ]);
  });

  test("conserve l'ordre reçu à l'intérieur d'un groupe", () => {
    // Given
    const conversations = [
      { id: "b", updatedAt: new Date("2026-09-08T16:20:00") },
      { id: "c", updatedAt: new Date("2026-09-05T08:00:00") },
    ];

    // When
    const groupes = grouperConversationsParPeriode({
      conversations,
      maintenant,
    });

    // Then
    expect(groupes[0].conversations.map((c) => c.id)).toEqual(["b", "c"]);
  });
});

describe("formaterDateConversation", () => {
  test("affiche l'heure pour une conversation du jour", () => {
    expect(
      formaterDateConversation({
        date: new Date("2026-09-09T09:05:00"),
        maintenant,
      }),
    ).toBe("09:05");
  });

  test("affiche le jour abrégé et la date sinon", () => {
    expect(
      formaterDateConversation({
        date: new Date("2026-09-08T16:20:00"),
        maintenant,
      }),
    ).toBe("mar. 08 sept.");
  });
});
