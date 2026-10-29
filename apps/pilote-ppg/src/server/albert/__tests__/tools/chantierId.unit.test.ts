import { describe, expect, test } from "vitest";
import {
  chantierIdSchema,
  chantierIdsSchema,
} from "@/server/albert/tools/chantierId";
import { getChantierObjectifsInputSchema } from "@/server/albert/tools/getChantierObjectifs";
import { getChantiersSignalesInputSchema } from "@/server/albert/tools/getChantiersSignales";

describe("chantierIdSchema", () => {
  test.each([
    ["CH-42", "CH-042"],
    ["CH-7", "CH-007"],
    ["ch-42", "CH-042"],
    ["CH42", "CH-042"],
    ["CH 42", "CH-042"],
    [" CH-42 ", "CH-042"],
    ["ch-064", "CH-064"],
    ["CH-042", "CH-042"],
  ])("normalise %j en %j", (saisie, attendu) => {
    // When
    const resultat = chantierIdSchema.parse(saisie);

    // Then
    expect(resultat).toEqual(attendu);
  });

  test.each(["CH-1234", "IND-042", "Mon chantier", ""])(
    "laisse %j tel quel",
    (saisie) => {
      // When
      const resultat = chantierIdSchema.parse(saisie);

      // Then
      expect(resultat).toEqual(saisie);
    },
  );

  test("normalise chaque identifiant d'une liste", () => {
    // When
    const resultat = chantierIdsSchema.parse(["CH-1", "CH-042", "ch42"]);

    // Then
    expect(resultat).toEqual(["CH-001", "CH-042", "CH-042"]);
  });
});

describe("schémas d'entrée des outils", () => {
  test("le chantier_id d'un outil est normalisé au parse", () => {
    // When
    const resultat = getChantierObjectifsInputSchema.parse({
      chantier_id: "CH-42",
    });

    // Then
    expect(resultat).toEqual({ chantier_id: "CH-042" });
  });

  test("les chantier_ids d'un outil sont normalisés au parse", () => {
    // When
    const resultat = getChantiersSignalesInputSchema.parse({
      territoire_code: "NAT-FR",
      chantier_ids: ["CH-42", "CH-7"],
    });

    // Then
    expect(resultat.chantier_ids).toEqual(["CH-042", "CH-007"]);
  });
});
