import { createPdf } from "pdfmake/build/pdfmake";
import * as vfs from "pdfmake/build/vfs_fonts";
import { buildRapportPDFContent } from "@/server/albert/pdf/buildRapportPDFContent";
import { RapportInput } from "@/server/albert/rapportInput";

export function genererRapportPDF(input: RapportInput): Promise<Buffer> {
  const content = buildRapportPDFContent(input);

  const pdf = {
    content,
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
  };

  return new Promise<Buffer>((resolve) => {
    createPdf(
      pdf,
      {},
      {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
        Courier: {
          normal: "Courier",
          bold: "Courier-Bold",
          italics: "Courier-Oblique",
          bolditalics: "Courier-BoldOblique",
        },
      },
      vfs,
    ).getBuffer(resolve);
  });
}
