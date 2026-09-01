import { z } from "zod";

// L'import applique l'error map globale FR posée par z.config : c'est elle qu'on exerce.
import "@/validation/utilisateur";

describe("error map globale francaise", () => {
  it("traduit une adresse electronique invalide", () => {
    // Given
    const schéma = z.string().email();

    // When
    const résultat = schéma.safeParse("pas-un-email");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "L'adresse électronique saisie n'est pas valide",
    ]);
  });

  it("traduit un champ requis", () => {
    // Given
    const schéma = z.string().min(1);

    // When
    const résultat = schéma.safeParse("");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "Le champ est requis",
    ]);
  });

  it("precise la longueur minimale au-dela d'un caractere", () => {
    // Given
    const schéma = z.string().min(3);

    // When
    const résultat = schéma.safeParse("ab");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "Le champ est requis (3 caractère(s) minimum)",
    ]);
  });

  it("traduit un depassement de longueur maximale", () => {
    // Given
    const schéma = z.string().max(5);

    // When
    const résultat = schéma.safeParse("beaucoup trop long");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "La longueur maximale du champ est dépassée (5 caractères maximum)",
    ]);
  });

  it("traduit une option invalide", () => {
    // Given
    const schéma = z.enum(["a", "b"]);

    // When
    const résultat = schéma.safeParse("zz");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "Veuillez choisir une option",
    ]);
  });

  it("laisse le message par defaut de zod pour les cas non couverts", () => {
    // Given
    const schéma = z.number();

    // When
    const résultat = schéma.safeParse("pas un nombre");

    // Then
    expect(résultat.error?.issues.map((issue) => issue.message)).toEqual([
      "Invalid input: expected number, received string",
    ]);
  });
});
