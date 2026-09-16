import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import {
  aplatir,
  projeter,
  retirerDescendants,
} from "@/client/components/_commons/CentreAide/editeur/arbreDnd";

const article = (
  id: string,
  ordre: number,
  parentId: string | null = null,
  type: "GROUPE" | "PAGE" = "PAGE",
): ArticleCentreAideContrat => ({
  id,
  titre: id,
  contenu: null,
  titreBrouillon: null,
  contenuBrouillon: null,
  titreAffiche: null,
  titreAfficheBrouillon: null,
  type,
  ordre,
  parentId,
  estPublie: false,
  estMasque: false,
});

describe("aplatir", () => {
  it("Doit produire une liste en profondeur d'abord, triée par ordre", () => {
    const articles = [
      article("page-b", 1),
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(aplatir(articles, new Set()).map((noeud) => noeud.id)).toEqual([
      "groupe",
      "enfant",
      "page-b",
    ]);
  });

  it("Doit masquer les enfants d'un groupe replié", () => {
    const articles = [
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(
      aplatir(articles, new Set(["groupe"])).map((noeud) => noeud.id),
    ).toEqual(["groupe"]);
  });

  it("Doit calculer la profondeur de chaque nœud", () => {
    const articles = [
      article("groupe", 0, null, "GROUPE"),
      article("enfant", 0, "groupe"),
    ];

    expect(aplatir(articles, new Set()).map((noeud) => noeud.depth)).toEqual([
      0, 1,
    ]);
  });
});

describe("retirerDescendants", () => {
  it("Doit retirer les descendants du nœud déplacé, mais pas le nœud lui-même", () => {
    const plat = aplatir(
      [
        article("groupe", 0, null, "GROUPE"),
        article("enfant", 0, "groupe"),
        article("page", 1),
      ],
      new Set(),
    );

    expect(retirerDescendants(plat, "groupe").map((noeud) => noeud.id)).toEqual(
      ["groupe", "page"],
    );
  });
});

describe("projeter", () => {
  it("Doit rattacher au groupe précédent quand on décale vers la droite", () => {
    const plat = aplatir(
      [article("groupe", 0, null, "GROUPE"), article("page", 1)],
      new Set(),
    );

    expect(projeter(plat, "page", "page", 20, 20)).toMatchObject({
      depth: 1,
      parentId: "groupe",
      index: 0,
    });
  });

  it("Doit refuser une PAGE comme parent et rester au niveau frère", () => {
    const plat = aplatir(
      [article("page-a", 0), article("page-b", 1)],
      new Set(),
    );

    expect(projeter(plat, "page-b", "page-b", 20, 20)).toMatchObject({
      depth: 0,
      parentId: null,
    });
  });

  it("Doit rester à la racine quand on décale vers la gauche", () => {
    const plat = aplatir(
      [article("groupe", 0, null, "GROUPE"), article("enfant", 0, "groupe")],
      new Set(),
    );

    expect(projeter(plat, "enfant", "enfant", -20, 20)).toMatchObject({
      depth: 0,
      parentId: null,
    });
  });
});
