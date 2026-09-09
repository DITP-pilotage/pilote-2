import { describe, expect, test } from "vitest";
import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";

describe("creerBufferPdf", () => {
  test("produit un buffer commençant par la signature PDF", async () => {
    const buffer = await creerBufferPdf([{ text: "Contenu de test" }]);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("latin1", 0, 5)).toBe("%PDF-");
  });
});
