import {
  affichageEffectif,
  bornerLargeurPanneau,
} from "@/components/_commons/ChatUI/affichageAssistant";

describe("affichageEffectif", () => {
  test.each(["modal", "sidePanel", "floating", "minimized"] as const)(
    "garde l'affichage %s sur un écran large",
    (affichage) => {
      // When
      const effectif = affichageEffectif({ affichage, tailleEcran: "large" });

      // Then
      expect(effectif).toBe(affichage);
    },
  );

  test("replie le panneau en fenêtre flottante sur un écran moyen", () => {
    // When
    const effectif = affichageEffectif({
      affichage: "sidePanel",
      tailleEcran: "moyenne",
    });

    // Then
    expect(effectif).toBe("floating");
  });

  test("garde la fenêtre flottante sur un écran moyen", () => {
    // When
    const effectif = affichageEffectif({
      affichage: "floating",
      tailleEcran: "moyenne",
    });

    // Then
    expect(effectif).toBe("floating");
  });

  test.each(["sidePanel", "floating", "modal"] as const)(
    "affiche la modale à la place de %s sur un écran étroit",
    (affichage) => {
      // When
      const effectif = affichageEffectif({
        affichage,
        tailleEcran: "etroite",
      });

      // Then
      expect(effectif).toBe("modal");
    },
  );

  test("garde le dock sur un écran étroit", () => {
    // When
    const effectif = affichageEffectif({
      affichage: "minimized",
      tailleEcran: "etroite",
    });

    // Then
    expect(effectif).toBe("minimized");
  });
});

describe("bornerLargeurPanneau", () => {
  test("garde une largeur comprise dans les bornes", () => {
    // When
    const largeur = bornerLargeurPanneau({ largeur: 600, largeurEcran: 1920 });

    // Then
    expect(largeur).toBe(600);
  });

  test("ne descend pas sous 400 px", () => {
    // When
    const largeur = bornerLargeurPanneau({ largeur: 250, largeurEcran: 1920 });

    // Then
    expect(largeur).toBe(400);
  });

  test("ne dépasse pas 720 px sur un grand écran", () => {
    // When
    const largeur = bornerLargeurPanneau({ largeur: 900, largeurEcran: 2560 });

    // Then
    expect(largeur).toBe(720);
  });

  test("laisse au moins 900 px à la page", () => {
    // When
    const largeur = bornerLargeurPanneau({ largeur: 700, largeurEcran: 1440 });

    // Then
    expect(largeur).toBe(540);
  });
});
