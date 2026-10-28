import { nomFichierEncart } from "@/components/_commons/ChatUI/telechargerEncart";

describe("nomFichierEncart", () => {
  test("nomme le fichier d'après le titre de l'encart", () => {
    // When
    const nom = nomFichierEncart({
      markdown: "# Synthèse pour le Nord\n\nDans PILOTE…",
      type: "synthese",
      dateRedaction: "2026-10-27",
    });

    // Then
    expect(nom).toEqual("synthese-pour-le-nord.md");
  });

  test("sans titre, le nomme d'après son type et sa date", () => {
    // When
    const nom = nomFichierEncart({
      markdown: "Dans PILOTE…",
      type: "comparaison",
      dateRedaction: "2026-10-27",
    });

    // Then
    expect(nom).toEqual("comparaison-territoriale-2026-10-27.md");
  });
});
