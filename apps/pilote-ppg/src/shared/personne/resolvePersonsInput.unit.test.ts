import { resolvePersonsInputSchema } from "@/shared/personne/resolvePersonsInput";

describe("resolvePersonsInputSchema", () => {
  test("accepte un id hexadécimal hors norme RFC, que la query écartera sans faire échouer le lot", () => {
    // Given — variante « 1e1f » : un caractère altéré par le modèle
    const ids = [
      "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f",
      "0b3c1f2e-8a4d-4c6b-1e1f-2a3b4c5d6e7f",
    ];

    // When
    const result = resolvePersonsInputSchema.safeParse({ ids });

    // Then
    expect(result.success).toBe(true);
  });

  test("refuse plus de 100 ids", () => {
    // When
    const result = resolvePersonsInputSchema.safeParse({
      ids: Array.from(
        { length: 101 },
        () => "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f",
      ),
    });

    // Then
    expect(result.success).toBe(false);
  });
});
