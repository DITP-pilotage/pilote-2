import type { Editor } from "@tiptap/react";
import { VARIANTES_CALLOUT } from "@/client/components/shared/Callout";
import { construireOptionsBlocs } from "@/client/components/_commons/CentreAide/editeur/blocs";

const editeur = {} as Editor;

describe("construireOptionsBlocs", () => {
  it("Doit proposer à l'insertion toutes les variantes d'encadré que sait afficher le rendu", () => {
    const encadre = construireOptionsBlocs(editeur).find(
      (option) => option.label === "Encadré",
    );

    expect(encadre?.sousOptions?.map((sousOption) => sousOption.label)).toEqual(
      VARIANTES_CALLOUT.map((variante) => variante.libelle),
    );
  });

  it("Doit offrir un retour au paragraphe et une citation", () => {
    const labels = construireOptionsBlocs(editeur).map(
      (option) => option.label,
    );

    expect(labels).toContain("Paragraphe");
    expect(labels).toContain("Citation");
  });

  it("Doit proposer les six niveaux de titre", () => {
    const titre = construireOptionsBlocs(editeur).find(
      (option) => option.label === "Titre",
    );

    expect(titre?.sousOptions?.map((sousOption) => sousOption.label)).toEqual([
      "Titre H1",
      "Titre H2",
      "Titre H3",
      "Titre H4",
      "Titre H5",
      "Titre H6",
    ]);
  });
});
