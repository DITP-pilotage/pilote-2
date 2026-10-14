import {
  formaterDateConversation,
  grouperConversationsParPeriode,
} from "@/components/_commons/ChatUI/grouperConversationsParPeriode";

const maintenant = new Date("2026-10-14T14:30:00");

describe("grouperConversationsParPeriode", () => {
  test("répartit les conversations entre aujourd'hui, cette semaine, ce mois-ci puis par mois", () => {
    // Given
    const conversations = [
      { id: "a", updatedAt: new Date("2026-10-14T09:41:00") },
      { id: "b", updatedAt: new Date("2026-10-13T16:20:00") },
      { id: "c", updatedAt: new Date("2026-10-08T08:00:00") },
      { id: "d", updatedAt: new Date("2026-10-07T08:00:00") },
      { id: "e", updatedAt: new Date("2026-10-01T08:00:00") },
      { id: "f", updatedAt: new Date("2026-09-30T08:00:00") },
      { id: "g", updatedAt: new Date("2026-08-12T08:00:00") },
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
      {
        libelle: "Ce mois-ci",
        conversations: [conversations[3], conversations[4]],
      },
      { libelle: "Septembre", conversations: [conversations[5]] },
      { libelle: "Août", conversations: [conversations[6]] },
    ]);
  });

  test("précise l'année pour les mois d'une autre année", () => {
    // Given
    const conversations = [
      { id: "a", updatedAt: new Date("2025-12-20T08:00:00") },
    ];

    // When
    const groupes = grouperConversationsParPeriode({
      conversations,
      maintenant,
    });

    // Then
    expect(groupes).toEqual([
      { libelle: "Décembre 2025", conversations: [conversations[0]] },
    ]);
  });

  test("omet les périodes vides", () => {
    // Given
    const conversations = [
      { id: "g", updatedAt: new Date("2026-08-12T08:00:00") },
    ];

    // When
    const groupes = grouperConversationsParPeriode({
      conversations,
      maintenant,
    });

    // Then
    expect(groupes.map((groupe) => groupe.libelle)).toEqual(["Août"]);
  });

  test("conserve l'ordre reçu à l'intérieur d'un groupe", () => {
    // Given
    const conversations = [
      { id: "b", updatedAt: new Date("2026-10-13T16:20:00") },
      { id: "c", updatedAt: new Date("2026-10-10T08:00:00") },
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
        date: new Date("2026-10-14T09:05:00"),
        maintenant,
      }),
    ).toBe("09:05");
  });

  test("affiche le jour et le mois abrégé pour l'année en cours", () => {
    expect(
      formaterDateConversation({
        date: new Date("2026-10-07T16:20:00"),
        maintenant,
      }),
    ).toBe("7 oct.");
  });

  test("ajoute l'année pour une autre année", () => {
    expect(
      formaterDateConversation({
        date: new Date("2025-12-20T16:20:00"),
        maintenant,
      }),
    ).toBe("20 déc. 2025");
  });
});
