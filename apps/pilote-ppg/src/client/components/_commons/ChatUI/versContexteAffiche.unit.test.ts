import { differenceDeContexte } from "@/components/_commons/ChatUI/versContexteAffiche";

const drome = { territoireNom: "26 - Drôme", jalon: 2026 };
const bouchesDuRhone = { territoireNom: "13 - Bouches-du-Rhône", jalon: 2026 };

describe("differenceDeContexte", () => {
  test("ne nomme que le territoire quand le jalon est le même", () => {
    // When
    const difference = differenceDeContexte({
      conversation: bouchesDuRhone,
      page: drome,
    });

    // Then
    expect(difference).toEqual({
      conversation: "13 - Bouches-du-Rhône",
      page: "26 - Drôme",
    });
  });

  test("ne nomme que le jalon quand le territoire est le même", () => {
    // When
    const difference = differenceDeContexte({
      conversation: { ...drome, jalon: 2025 },
      page: drome,
    });

    // Then
    expect(difference).toEqual({
      conversation: "jalon 2025",
      page: "jalon 2026",
    });
  });

  test("nomme le territoire de la conversation quand seule la page porte un chantier", () => {
    // When
    const difference = differenceDeContexte({
      conversation: drome,
      page: { ...drome, chantierId: "CH-042" },
    });

    // Then
    expect(difference).toEqual({
      conversation: "26 - Drôme",
      page: "CH-042",
    });
  });

  test("signale une conversation sans contexte", () => {
    // When
    const difference = differenceDeContexte({
      conversation: undefined,
      page: drome,
    });

    // Then
    expect(difference).toEqual({
      conversation: null,
      page: "26 - Drôme · jalon 2026",
    });
  });
});
