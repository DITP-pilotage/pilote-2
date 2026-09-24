import { z } from "zod";
import { pdfmake } from "@/server/pdf/pdfmake";

import { PDFContentAdapter } from "@/server/evaluation/domain/PDFContentAdapter";

export const genererPDFAutoEvaluationCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export class GenererPDFEvaluationHandler {
  async execute(adapter: PDFContentAdapter) {
    const content = adapter.getContent();

    const pdf = {
      content,
      defaultStyle: { font: "Roboto" },
      pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    };

    const buffer = await pdfmake.createPdf(pdf).getBuffer();

    return buffer.toString("base64");
  }
}
