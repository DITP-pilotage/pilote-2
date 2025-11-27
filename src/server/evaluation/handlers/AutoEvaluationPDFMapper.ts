import { Content, TableCell } from "pdfmake/interfaces";
import { AfficherAutoEvaluationViewModel } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import {
  createPageHeader,
  createPageHeaderWithBreak,
  createTable,
  createSectionTitle,
  createCommentCell,
  createScoreCell,
  createText,
  createLabeledText,
} from "./pdfFactories";

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

export class AutoEvaluationPDFMapper {
  constructor(private autoEvaluation: AfficherAutoEvaluationViewModel) {}

  private getRattachementLabel(): string {
    const { code, libelle } = this.autoEvaluation.rattachement;
    return `${code} - ${libelle}`;
  }

  private mapCriteresPage(): Content[] {
    if (this.autoEvaluation.criteres.length === 0) {
      return [];
    }

    const tableBody: TableCell[][] = [];

    this.autoEvaluation.criteres.forEach((critere) => {
      tableBody.push(
        [createSectionTitle(critere.libelle), {}],
        [
          createCommentCell(critere.evaluation.commentaire),
          createScoreCell(formatterNote(critere.evaluation.note)),
        ],
      );
    });

    return [
      createPageHeader(
        `Auto-évaluation - Manière de servir - ${this.getRattachementLabel()}`,
      ),
      createTable(tableBody),
    ];
  }

  private mapObjectifsPage(): Content[] {
    if (this.autoEvaluation.objectifs.length === 0) {
      return [];
    }

    const tableBody: TableCell[][] = [];

    this.autoEvaluation.objectifs.forEach((objectif) => {
      tableBody.push(
        [createSectionTitle(objectif.libelle), {}],
        [
          createCommentCell(objectif.evaluation.commentaire),
          createScoreCell(formatterNote(objectif.evaluation.note)),
        ],
      );
    });

    return [
      createPageHeaderWithBreak(
        `Auto-évaluation - Objectifs - ${this.getRattachementLabel()}`,
      ),
      createTable(tableBody),
    ];
  }

  private mapFichesCadragePage(): Content[] {
    if (this.autoEvaluation.objectifs.length === 0) {
      return [];
    }

    const tableBody: TableCell[][] = [];

    this.autoEvaluation.objectifs.forEach((objectif) => {
      tableBody.push(
        [createSectionTitle(objectif.libelle), {}],
        [
          createText(createLabeledText("Descriptif", objectif.descriptif), {
            margin: [5, 5, 5, 5],
          }),
          {},
        ],
        [
          createText(
            createLabeledText("Indicateur + cible", objectif.indicateurCible),
            {
              margin: [5, 5, 5, 5],
            },
          ),
          {},
        ],
      );
    });

    return [
      createPageHeaderWithBreak(
        "Auto-évaluation - Fiches de cadrage - Objectifs",
      ),
      createTable(tableBody, { rowModulo: 3 }),
    ];
  }

  private mapAnnexesCriteresPage(): Content[] {
    if (this.autoEvaluation.criteres.length === 0) {
      return [];
    }

    const tableBody: TableCell[][] = [];

    this.autoEvaluation.criteres.forEach((critere) => {
      const annexeText = critere.evaluation.annexe
        ? stripHtml(critere.evaluation.annexe)
        : null;

      tableBody.push(
        [createSectionTitle(critere.libelle), {}],
        [
          createText(annexeText || "Aucune annexe", {
            italics: !annexeText,
            color: annexeText ? "#555555" : "#999999",
          }),
          {},
        ],
      );
    });

    return [
      createPageHeaderWithBreak(
        "Auto-évaluation - Annexes - Manière de servir",
      ),
      createTable(tableBody),
    ];
  }

  private mapAnnexesObjectifsPage(): Content[] {
    if (this.autoEvaluation.objectifs.length === 0) {
      return [];
    }

    const tableBody: TableCell[][] = [];

    this.autoEvaluation.objectifs.forEach((objectif) => {
      const annexeText = objectif.evaluation.annexe
        ? stripHtml(objectif.evaluation.annexe)
        : null;

      tableBody.push(
        [createSectionTitle(objectif.libelle), {}],
        [
          createText(annexeText || "Aucune annexe", {
            italics: !annexeText,
            color: annexeText ? "#555555" : "#999999",
          }),
          {},
        ],
      );
    });

    return [
      createPageHeaderWithBreak("Auto-évaluation - Annexes - Objectifs"),
      createTable(tableBody),
    ];
  }

  mapToContent(): Content[] {
    return [
      ...this.mapCriteresPage(),
      ...this.mapObjectifsPage(),
      ...this.mapFichesCadragePage(),
      ...this.mapAnnexesCriteresPage(),
      ...this.mapAnnexesObjectifsPage(),
    ];
  }
}
