import { z } from "zod";
import { createPdf } from "pdfmake/build/pdfmake";
import * as v from "pdfmake/build/vfs_fonts";
import { AfficherAutoEvaluationViewModel } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";

export const genererPDFAutoEvaluationCommandSchema = z.object({
  ficheEvaluationId: z.string(),
});

export type GenererPDFAutoEvaluationCommand = z.infer<
  typeof genererPDFAutoEvaluationCommandSchema
>;

export class GenererPDFAutoEvaluationHandler {
  async execute(
    getAutoEvaluation: () => Promise<AfficherAutoEvaluationViewModel>,
  ) {
    // Get the auto evaluation data
    const autoEvaluation = await getAutoEvaluation();

    const pdf = {
      content: [
        {
          text: "Hello World",
          fontSize: 20,
        },
      ],
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
