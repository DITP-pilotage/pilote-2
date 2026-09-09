import { describe, expect, test } from "vitest";
import { genererPdfDepuisMarkdown } from "@/server/albert/pdf/genererPdfDepuisMarkdown";

describe("genererPdfDepuisMarkdown", () => {
  test("génère un PDF valide depuis une chaîne markdown", async () => {
    const buffer = await genererPdfDepuisMarkdown(
      "## Synthèse\n\nUn paragraphe simple.",
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("latin1", 0, 5)).toBe("%PDF-");
  });
});
