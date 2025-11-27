import { Content } from "pdfmake/interfaces";
import { AfficherAutoEvaluationViewModel } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { PDFContentAdapter } from "@/server/evaluation/domain/PDFContentAdapter";
import {
  createCommentCell,
  createLabeledText,
  createPageHeader,
  createScoreCell,
  createSectionTitle,
  createTable,
  createText,
} from "@/server/evaluation/handlers/pdfFactories";

const formatterNote = (note: number | null): string => {
  if (note === null) return "Non évalué";
  return `${note}/100`;
};

const stripHtml = (html: string | null) => {
  if (!html) return null;
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

export class AutoEvaluationPDFAdapter implements PDFContentAdapter {
  constructor(private autoEvaluation: AfficherAutoEvaluationViewModel) {}

  private getRattachementLabel(): string {
    const { code, libelle } = this.autoEvaluation.rattachement;
    return `${code} - ${libelle}`;
  }

  private mapCriteresPage(): Content[] {
    return [
      createPageHeader({
        title: `Auto-évaluation - Manière de servir - ${this.getRattachementLabel()}`,
      }),
      createTable(
        this.autoEvaluation.criteres.flatMap((critere) => [
          [createSectionTitle({ title: critere.libelle, colSpan: 2 }), {}],
          [
            createCommentCell({ comment: critere.evaluation.commentaire }),
            createScoreCell({ score: formatterNote(critere.evaluation.note) }),
          ],
        ]),
        { rowModulo: 2, widths: ["*", 80] },
      ),
    ];
  }

  private mapObjectifsPage(): Content[] {
    return [
      createPageHeader({
        title: `Auto-évaluation - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
      createTable(
        this.autoEvaluation.objectifs.flatMap((objectif) => [
          [createSectionTitle({ title: objectif.libelle, colSpan: 2 }), {}],
          [
            createCommentCell({ comment: objectif.evaluation.commentaire }),
            createScoreCell({ score: formatterNote(objectif.evaluation.note) }),
          ],
        ]),
        { rowModulo: 2, widths: ["*", 80] },
      ),
    ];
  }

  private mapFichesCadragePage(): Content[] {
    return [
      createPageHeader({
        title: `Auto-évaluation - Fiches de cadrage - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
      createTable(
        this.autoEvaluation.objectifs.flatMap((objectif) => [
          [createSectionTitle({ title: objectif.libelle, colSpan: 2 }), {}],
          [
            createText({
              text: createLabeledText({
                label: "Descriptif",
                text: objectif.descriptif,
              }),
              margin: [5, 5, 5, 5],
            }),
            createText({
              text: createLabeledText({
                label: "Indicateur + cible",
                text: objectif.indicateurCible,
              }),
              margin: [5, 5, 5, 5],
            }),
          ],
        ]),
        { rowModulo: 3, widths: ["*", "*"] },
      ),
    ];
  }

  private mapAnnexesCriteresPage(): Content[] {
    return [
      createPageHeader({
        title: `Auto-évaluation - Annexes - Manière de servir - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
      createTable(
        this.autoEvaluation.criteres.flatMap((critere) => {
          const annexeText = stripHtml(critere.evaluation.annexe);

          return [
            [createSectionTitle({ title: critere.libelle })],
            [
              createText({
                text: annexeText || "Aucune annexe",
                italics: !annexeText,
                color: annexeText ? "#555555" : "#999999",
              }),
            ],
          ];
        }),
        { rowModulo: 2, widths: ["*"] },
      ),
    ];
  }

  private mapAnnexesObjectifsPage(): Content[] {
    return [
      createPageHeader({
        title: `Auto-évaluation - Annexes - Objectifs - ${this.getRattachementLabel()}`,
        pageBreak: "before",
      }),
      createTable(
        this.autoEvaluation.objectifs.flatMap((objectif) => {
          const annexeText = stripHtml(objectif.evaluation.annexe);

          return [
            [createSectionTitle({ title: objectif.libelle })],
            [
              createText({
                text: annexeText || "Aucune annexe",
                italics: !annexeText,
                color: annexeText ? "#555555" : "#999999",
              }),
            ],
          ];
        }),
        { rowModulo: 2, widths: ["*"] },
      ),
    ];
  }

  getContent(): Content[] {
    return [
      ...this.mapCriteresPage(),
      ...this.mapObjectifsPage(),
      ...this.mapFichesCadragePage(),
      ...this.mapAnnexesCriteresPage(),
      ...this.mapAnnexesObjectifsPage(),
    ];
  }
}
