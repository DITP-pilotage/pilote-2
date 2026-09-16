import {
  classesMedia,
  lireAlignement,
  lireLargeur,
} from "@/client/components/_commons/CentreAide/alignementMedia";

describe("lireAlignement", () => {
  it("Doit accepter une valeur connue", () => {
    expect(lireAlignement("centre")).toBe("centre");
  });

  it("Doit retomber sur la gauche quand la valeur est absente ou inconnue", () => {
    expect(lireAlignement(undefined)).toBe("gauche");
    expect(lireAlignement("diagonale")).toBe("gauche");
  });
});

describe("lireLargeur", () => {
  it("Doit accepter une valeur connue", () => {
    expect(lireLargeur("pleine")).toBe("pleine");
  });

  it("Doit retomber sur la largeur moyenne quand la valeur est absente ou inconnue", () => {
    expect(lireLargeur(undefined)).toBe("moyenne");
    expect(lireLargeur("enorme")).toBe("moyenne");
  });
});

describe("classesMedia", () => {
  it("Doit centrer un media à la largeur demandée", () => {
    const classes = classesMedia({ alignement: "centre", largeur: "petite" });

    expect(classes).toContain("mx-auto");
    expect(classes).toContain("max-w-[320px]");
  });

  it("Doit aligner à droite", () => {
    expect(
      classesMedia({ alignement: "droite", largeur: "moyenne" }),
    ).toContain("ml-auto");
  });

  it("Doit reproduire le rendu historique quand aucun attribut n'est présent", () => {
    const classes = classesMedia({});

    expect(classes).toContain("mr-auto");
    expect(classes).toContain("max-w-[560px]");
  });
});
