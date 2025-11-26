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

    const stripHtml = (html: string): string => {
      // Replace block-level elements with newlines
      let text = html.replace(
        /<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th)>/gi,
        "\n",
      );
      // Replace <br> tags with newlines
      text = text.replace(/<br\s*\/?>/gi, "\n");
      // Replace list items with bullet points
      text = text.replace(/<li[^>]*>/gi, "\n• ");
      // Remove all remaining HTML tags
      text = text.replace(/<[^>]*>/g, "");
      // Decode common HTML entities
      text = text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      // Clean up multiple newlines and trim
      text = text.replace(/\n\s*\n\s*\n/g, "\n\n").trim();
      return text;
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

    // Page 3: Fiches de cadrage - Objectifs
    if (autoEvaluation.objectifs.length > 0) {
      content.push({
        text: `Auto-évaluation - Fiches de cadrage - Objectifs`,
        fontSize: 16,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
        pageBreak: "before",
      });

      const fichesCadrageTableBody: any[] = [];

      autoEvaluation.objectifs.forEach((objectif) => {
        fichesCadrageTableBody.push([
          {
            text: objectif.libelle,
            fontSize: 10,
            bold: true,
            colSpan: 2,
            margin: [5, 5, 5, 5],
          },
          {},
        ]);

        fichesCadrageTableBody.push([
          {
            text: [
              { text: "Descriptif :\n", bold: true },
              {
                text: objectif.descriptif || "Aucune description",
                color: objectif.descriptif ? "#555555" : "#999999",
                italics: !objectif.descriptif,
              },
            ],
            fontSize: 8,
            margin: [5, 5, 5, 5],
            colSpan: 2,
          },
          {},
        ]);

        fichesCadrageTableBody.push([
          {
            text: [
              { text: "Indicateur + cible :\n", bold: true },
              {
                text: objectif.indicateurCible || "Aucun indicateur",
                color: objectif.indicateurCible ? "#555555" : "#999999",
                italics: !objectif.indicateurCible,
              },
            ],
            fontSize: 8,
            margin: [5, 5, 5, 5],
            colSpan: 2,
          },
          {},
        ]);
      });

      content.push({
        table: {
          headerRows: 0,
          widths: ["*", 80],
          body: fichesCadrageTableBody,
        },
        layout: {
          hLineWidth: (i: number) => {
            return i % 3 === 0 ? 1 : 0.5;
          },
          vLineWidth: () => 0.5,
          hLineColor: () => "#CCCCCC",
          vLineColor: () => "#CCCCCC",
          fillColor: (i: number) => {
            return i % 3 === 0 ? "#F6F6F6" : null;
          },
        },
        margin: [0, 0, 0, 20],
      });
    }

    // Page 4: Annexes - Manière de servir
    if (autoEvaluation.criteres.length > 0) {
      content.push({
        text: `Auto-évaluation - Annexes - Manière de servir`,
        fontSize: 16,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
        pageBreak: "before",
      });

      const annexesCriteresTableBody: any[] = [];

      autoEvaluation.criteres.forEach((critere) => {
        annexesCriteresTableBody.push([
          {
            text: critere.libelle,
            fontSize: 10,
            bold: true,
            colSpan: 2,
            margin: [5, 5, 5, 5],
          },
          {},
        ]);

        annexesCriteresTableBody.push([
          {
            text: critere.evaluation.annexe
              ? stripHtml(critere.evaluation.annexe)
              : "Aucune annexe",
            fontSize: 8,
            color: critere.evaluation.annexe ? "#555555" : "#999999",
            italics: !critere.evaluation.annexe,
            margin: [5, 5, 5, 5],
            colSpan: 2,
          },
          {},
        ]);
      });

      content.push({
        table: {
          headerRows: 0,
          widths: ["*", 80],
          body: annexesCriteresTableBody,
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

    // Page 5: Annexes - Objectifs
    if (autoEvaluation.objectifs.length > 0) {
      content.push({
        text: `Auto-évaluation - Annexes - Objectifs`,
        fontSize: 16,
        bold: true,
        color: "#000091",
        margin: [0, 0, 0, 15],
        pageBreak: "before",
      });

      const annexesObjectifsTableBody: any[] = [];

      autoEvaluation.objectifs.forEach((objectif) => {
        annexesObjectifsTableBody.push([
          {
            text: objectif.libelle,
            fontSize: 10,
            bold: true,
            colSpan: 2,
            margin: [5, 5, 5, 5],
          },
          {},
        ]);

        annexesObjectifsTableBody.push([
          {
            text: objectif.evaluation.annexe
              ? stripHtml(objectif.evaluation.annexe)
              : "Aucune annexe",
            fontSize: 8,
            color: objectif.evaluation.annexe ? "#555555" : "#999999",
            italics: !objectif.evaluation.annexe,
            margin: [5, 5, 5, 5],
            colSpan: 2,
          },
          {},
        ]);
      });

      content.push({
        table: {
          headerRows: 0,
          widths: ["*", 80],
          body: annexesObjectifsTableBody,
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
