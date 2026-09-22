import { pdfmake } from "@/server/pdf/pdfmake";
import { buildRapportPDFContent } from "@/server/albert/pdf/buildRapportPDFContent";
import { RapportInput } from "@/server/albert/rapportInput";

export function genererRapportPDF(input: RapportInput): Promise<Buffer> {
  const content = buildRapportPDFContent(input);

  const pdf = {
    content,
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
  };

  return pdfmake.createPdf(pdf).getBuffer();
}
