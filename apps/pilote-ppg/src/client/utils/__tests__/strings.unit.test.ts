import { slugifier } from "@/client/utils/strings";

describe("slugifier", () => {
  test("met le texte en minuscules sans accents, mots séparés par des tirets", () => {
    // When
    const slug = slugifier({ texte: "Synthèse pour l'Île-de-France" });

    // Then
    expect(slug).toEqual("synthese-pour-l-ile-de-france");
  });

  test("retire les tirets en début et en fin de texte", () => {
    // When
    const slug = slugifier({ texte: "  « Comparaison : Nord / Gironde »  " });

    // Then
    expect(slug).toEqual("comparaison-nord-gironde");
  });
});
