import { affichageEffectif } from "@/components/_commons/ChatUI/affichageAssistant";

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
