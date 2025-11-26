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
    const autoEvaluation = await getAutoEvaluation();

    const formatterNote = (note: number | null): string => {
      if (note === null) return "Non évalué";
      return `${note}/4`;
    };

    const content = [];

    // Header
    content.push(
      {
        text: "Auto-évaluation",
        fontSize: 24,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 10],
      },
      {
        text: `${autoEvaluation.rattachement.code} - ${autoEvaluation.rattachement.libelle}`,
        fontSize: 16,
        color: "#666666",
        margin: [0, 0, 0, 20],
      },
      {
        text: `Date : ${new Date(autoEvaluation.dateDerniereModification).toLocaleDateString("fr-FR")}`,
        fontSize: 10,
        color: "#666666",
        margin: [0, 0, 0, 30],
      },
    );

    // Objectifs section
    if (autoEvaluation.objectifs.length > 0) {
      content.push({
        text: "Objectifs individuels",
        fontSize: 18,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
      });

      autoEvaluation.objectifs.forEach((objectif, index) => {
        content.push(
          {
            text: objectif.libelle,
            fontSize: 14,
            bold: true,
            margin: [0, index > 0 ? 15 : 0, 0, 5],
          },
          {
            text: `Note : ${formatterNote(objectif.evaluation.note)}`,
            fontSize: 12,
            margin: [0, 0, 0, 5],
            color: "#333333",
          },
        );

        if (objectif.evaluation.commentaire) {
          content.push({
            text: objectif.evaluation.commentaire,
            fontSize: 11,
            margin: [10, 0, 0, 0],
            color: "#555555",
            italics: true,
          });
        }
      });

      content.push({ text: "", margin: [0, 20, 0, 0] });
    }

    // Critères section
    if (autoEvaluation.criteres.length > 0) {
      content.push({
        text: "Manière de servir",
        fontSize: 18,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
      });

      autoEvaluation.criteres.forEach((critere, index) => {
        content.push(
          {
            text: critere.libelle,
            fontSize: 14,
            bold: true,
            margin: [0, index > 0 ? 15 : 0, 0, 5],
          },
          {
            text: `Note : ${formatterNote(critere.evaluation.note)}`,
            fontSize: 12,
            margin: [0, 0, 0, 5],
            color: "#333333",
          },
        );

        if (critere.evaluation.commentaire) {
          content.push({
            text: critere.evaluation.commentaire,
            fontSize: 11,
            margin: [10, 0, 0, 0],
            color: "#555555",
            italics: true,
          });
        }
      });
    }

    const pdf = {
      content,
      defaultStyle: {
        font: "Roboto",
      },
      pageMargins: [40, 60, 40, 60],
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
