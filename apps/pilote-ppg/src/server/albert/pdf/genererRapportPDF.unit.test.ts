import { describe, expect, it } from "vitest";

import { genererRapportPDF } from "@/server/albert/pdf/genererRapportPDF";
import { RapportInput } from "@/server/albert/rapportInput";

const rapport: RapportInput = {
  titre: "Rapport de sobriété",
  date: "2026-09-22",
  resume: "Un résumé accentué : é à ù ç",
  sections: [
    {
      titre: "Constats",
      parties: [
        {
          type: "paragraphe",
          contenu: "Un paragraphe avec `du code` et du **gras**.",
        },
        {
          type: "tableau",
          en_tetes: ["Indicateur", "Valeur"],
          lignes: [["Taux", "42 %"]],
        },
      ],
    },
  ],
};

describe("genererRapportPDF", () => {
  it("rend un document PDF exploitable", async () => {
    const buffer = await genererRapportPDF(rapport);

    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buffer.subarray(-6).toString("latin1")).toContain("%%EOF");
  });

  it("embarque les polices que le document déclare, Roboto comme Courier", async () => {
    const buffer = await genererRapportPDF(rapport);
    const contenu = buffer.toString("latin1");

    expect(contenu).toContain("Roboto");
    expect(contenu).toContain("Courier");
  });
});
