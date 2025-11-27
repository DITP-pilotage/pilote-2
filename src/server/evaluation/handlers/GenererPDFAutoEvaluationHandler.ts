import { z } from "zod";
import { createPdf } from "pdfmake/build/pdfmake";
import * as v from "pdfmake/build/vfs_fonts";

import { PDFContentAdapter } from "@/server/evaluation/domain/PDFContentAdapter";

export const genererPDFAutoEvaluationCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export class GenererPDFAutoEvaluationHandler {
  async execute(adapter: PDFContentAdapter) {
    const content = adapter.getContent();

    const pdf = {
      content,
      defaultStyle: { font: "Roboto" },
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    };

    const buffer = await new Promise<Buffer>((resolve) => {
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
        v.vfs,
      ).getBuffer(resolve);
    });

    return buffer.toString("base64");
  }
}
