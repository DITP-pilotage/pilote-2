import { withMarianne } from "@/server/pdf/pdfmake";

describe("police Marianne", () => {
  it("embarque Marianne et restitue les caractères français", async () => {
    const buffer = await withMarianne()
      .createPdf({
        content: [{ text: "Équipe « été » — 42 %", bold: true }],
        defaultStyle: { font: "Marianne" },
      })
      .getBuffer();

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.toString("latin1")).toContain("Marianne-Bold");
  });

  it("garde Roboto pour les PDF existants", async () => {
    const buffer = await withMarianne()
      .createPdf({ content: ["Bonjour"], defaultStyle: { font: "Roboto" } })
      .getBuffer();

    expect(buffer.toString("latin1")).toContain("Roboto");
  });
});
