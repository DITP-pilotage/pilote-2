import { describe, expect, test } from "vitest";
import { z } from "zod";
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

describe("perimetre", () => {
  test("expose le type en enum dans le JSON Schema, que le modèle lit, et non en const", () => {
    // When
    const schema = z.toJSONSchema(variantesPerimetre.TOUTES_REGIONS);

    // Then
    expect(schema.properties?.type).toEqual({
      type: "string",
      enum: ["TOUTES_REGIONS"],
    });
  });

  test("la description ne liste que les types acceptés, avec leur champ", () => {
    // When
    const description = descriptionPerimetre({
      types: ["SELECTION", "REGION_ET_SES_DEPARTEMENTS"],
    });

    // Then
    expect(description).toContain("SELECTION, avec territoire_codes");
    expect(description).toContain(
      "REGION_ET_SES_DEPARTEMENTS, avec region_code",
    );
    expect(description).not.toContain("TOUTES_REGIONS");
  });
});
