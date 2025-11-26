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
      return `${note}/100`;
    };

    const content: any[] = [];

    const rattachementLabel = `${autoEvaluation.rattachement.code} - ${autoEvaluation.rattachement.libelle}`;

    // Page 1: Manière de servir
    if (autoEvaluation.criteres.length > 0) {
      content.push({
        text: `Auto-évaluation - Manière de servir - ${rattachementLabel}`,
        fontSize: 16,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
      });

      const criteresTableBody: any[] = [];

      autoEvaluation.criteres.forEach((critere) => {
        criteresTableBody.push([
          {
            text: critere.libelle,
            fontSize: 10,
            bold: true,
            colSpan: 2,
            margin: [5, 5, 5, 5],
          },
          {},
        ]);

        criteresTableBody.push([
          {
            text: critere.evaluation.commentaire || "Aucun commentaire",
            fontSize: 8,
            color: critere.evaluation.commentaire ? "#555555" : "#999999",
            italics: !critere.evaluation.commentaire,
            margin: [5, 5, 5, 5],
          },
          {
            text: formatterNote(critere.evaluation.note),
            fontSize: 8,
            bold: true,
            alignment: "center",
            margin: [5, 5, 5, 5],
            color: "#000091",
          },
        ]);
      });

      content.push({
        table: {
          headerRows: 0,
          widths: ["*", 80],
          body: criteresTableBody,
        },
        layout: {
          hLineWidth: (i: number) => {
            return i % 2 === 0 ? 1 : 0.5;
          },
          vLineWidth: () => 0.5,
          hLineColor: () => "#CCCCCC",
          vLineColor: () => "#CCCCCC",
          fillColor: (i: number) => {
            return i % 2 === 0 ? "#F6F6F6" : null;
          },
        },
        margin: [0, 0, 0, 20],
      });
    }

    // Page 2: Objectifs
    if (autoEvaluation.objectifs.length > 0) {
      content.push({
        text: `Auto-évaluation - Objectifs - ${rattachementLabel}`,
        fontSize: 16,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
        pageBreak: "before",
      });

      const objectifsTableBody: any[] = [];

      autoEvaluation.objectifs.forEach((objectif) => {
        objectifsTableBody.push([
          {
            text: objectif.libelle,
            fontSize: 10,
            bold: true,
            colSpan: 2,
            margin: [5, 5, 5, 5],
          },
          {},
        ]);

        objectifsTableBody.push([
          {
            text: objectif.evaluation.commentaire || "Aucun commentaire",
            fontSize: 8,
            color: objectif.evaluation.commentaire ? "#555555" : "#999999",
            italics: !objectif.evaluation.commentaire,
            margin: [5, 5, 5, 15],
          },
          {
            text: formatterNote(objectif.evaluation.note),
            fontSize: 8,
            bold: true,
            alignment: "center",
            margin: [5, 5, 5, 5],
            color: "#000091",
          },
        ]);
      });

      content.push({
        table: {
          headerRows: 0,
          widths: ["*", 80],
          body: objectifsTableBody,
        },
        layout: {
          hLineWidth: (i: number) => {
            return i % 2 === 0 ? 1 : 0.5;
          },
          vLineWidth: () => 0.5,
          hLineColor: () => "#CCCCCC",
          vLineColor: () => "#CCCCCC",
          fillColor: (i: number) => {
            return i % 2 === 0 ? "#F6F6F6" : null;
          },
        },
        margin: [0, 0, 0, 20],
      });
    }

    // Page 3: Fiches de cadrage - Manière de servir
    content.push({
      text: `Auto-évaluation - Fiches de cadrage - Manière de servir`,
      fontSize: 16,
      bold: true,
      color: "#000091",
      margin: [0, 0, 0, 15],
      pageBreak: "before",
    });

    // Page 4: Fiches de cadrage - Objectifs
    content.push({
      text: `Auto-évaluation - Fiches de cadrage - Objectifs`,
      fontSize: 16,
      bold: true,
      color: "#000091",
      margin: [0, 0, 0, 15],
      pageBreak: "before",
    });

    // Page 5: Annexes - Manière de servir
    content.push({
      text: `Auto-évaluation - Annexes - Manière de servir`,
      fontSize: 16,
      bold: true,
      color: "#000091",
      margin: [0, 0, 0, 15],
      pageBreak: "before",
    });

    // Page 6: Annexes - Objectifs
    content.push({
      text: `Auto-évaluation - Annexes - Objectifs`,
      fontSize: 16,
      bold: true,
      color: "#000091",
      margin: [0, 0, 0, 15],
      pageBreak: "before",
    });

    const pdf = {
      content,
      defaultStyle: {
        font: "Roboto",
      },
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
