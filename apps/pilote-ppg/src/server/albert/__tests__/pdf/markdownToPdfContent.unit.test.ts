import { describe, expect, test } from "vitest";
import { markdownToPdfContent } from "@/server/albert/pdf/markdownToPdfContent";

describe("markdownToPdfContent", () => {
  test("convertit un tableau markdown GFM en tableau pdfmake structuré (pas de markdown brut)", () => {
    const markdown = [
      "| Département | Avancement |",
      "| --- | --- |",
      "| Ain | 42% |",
    ].join("\n");

    const content = markdownToPdfContent(markdown);

    expect(content).toEqual([
      {
        table: {
          headerRows: 0,
          widths: ["*", "*"],
          body: [
            [
              {
                text: ["Département"],
                fontSize: 8,
                bold: true,
                color: "#555555",
              },
              {
                text: ["Avancement"],
                fontSize: 8,
                bold: true,
                color: "#555555",
              },
            ],
            [
              { text: ["Ain"], fontSize: 8, bold: false, color: "#555555" },
              { text: ["42%"], fontSize: 8, bold: false, color: "#555555" },
            ],
          ],
        },
        layout: {
          hLineWidth: expect.any(Function),
          vLineWidth: expect.any(Function),
          hLineColor: expect.any(Function),
          vLineColor: expect.any(Function),
          fillColor: expect.any(Function),
        },
        margin: [0, 0, 0, 20],
      },
    ]);
  });

  test("préserve la mise en forme inline (gras) dans les cellules d'un tableau (régression CH-050 AURA)", () => {
    const markdown = "| Zone | Statut |\n| --- | --- |\n| CH-050 | **En retard** |";

    const content = markdownToPdfContent(markdown);
    const tableContent = content[0] as { table: { body: unknown[][] } };
    const celluleStatut = tableContent.table.body[1][1] as { text: unknown[] };

    expect(celluleStatut.text).toEqual([{ text: ["En retard"], bold: true }]);
  });
});
