import { Content, TableCell } from "pdfmake/interfaces";
import { AfficherAutoEvaluationViewModel } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import {
  createCommentCell,
  createLabeledText,
  createPageHeader,
  createScoreCell,
  createSectionTitle,
  createTable,
  createText,
} from "./pdfFactories";

const formatterNote = (note: number | null): string => {
  if (note === null) return "Non évalué";
  return `${note}/100`;
};

const stripHtml = (html: string): string => {
  // Remplace les éléments de bloc par des sauts de ligne
  let text = html.replace(
    /<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|tr|td|th)>/gi,
    "\n",
  );
  // Remplace les balises <br> par des sauts de ligne
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Remplace les éléments de liste par des puces
  text = text.replace(/<li[^>]*>/gi, "\n• ");
  // Supprime toutes les balises HTML restantes
  text = text.replace(/<[^>]*>/g, "");
  // Décode les entités HTML courantes
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Nettoie les sauts de ligne multiples et retire les espaces superflus
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
        [createSectionTitle({ title: critere.libelle }), {}],
        [
          createCommentCell({ comment: critere.evaluation.commentaire }),
          createScoreCell({ score: formatterNote(critere.evaluation.note) }),
        ],
      );
    });

    return [
      createPageHeader({
        title: `Auto-évaluation - Manière de servir - ${this.getRattachementLabel()}`,
      }),
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
        [createSectionTitle({ title: objectif.libelle }), {}],
        [
          createCommentCell({ comment: objectif.evaluation.commentaire }),
          createScoreCell({ score: formatterNote(objectif.evaluation.note) }),
        ],
      );
    });

    return [
      createPageHeader({
        title: `Auto-évaluation - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
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
        [createSectionTitle({ title: objectif.libelle }), {}],
        [
          createText({
            text: createLabeledText({
              label: "Descriptif",
              text: objectif.descriptif,
            }),
            margin: [5, 5, 5, 5],
          }),
          {},
        ],
        [
          createText({
            text: createLabeledText({
              label: "Indicateur + cible",
              text: objectif.indicateurCible,
            }),
            margin: [5, 5, 5, 5],
          }),
          {},
        ],
      );
    });

    return [
      createPageHeader({
        title: `Auto-évaluation - Fiches de cadrage - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
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
        [createSectionTitle({ title: critere.libelle }), {}],
        [
          createText({
            text: annexeText || "Aucune annexe",
            italics: !annexeText,
            color: annexeText ? "#555555" : "#999999",
          }),
          {},
        ],
      );
    });

    return [
      createPageHeader({
        title: `Auto-évaluation - Annexes - Manière de servir - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
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
        [createSectionTitle({ title: objectif.libelle }), {}],
        [
          createText({
            text: annexeText || "Aucune annexe",
            italics: !annexeText,
            color: annexeText ? "#555555" : "#999999",
          }),
          {},
        ],
      );
    });

    return [
      createPageHeader({
        title: `Auto-évaluation - Annexes - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
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
