import { $Enums } from "@prisma/client";
import { Content } from "pdfmake/interfaces";
import { PDFContentAdapter } from "@/server/evaluation/domain/PDFContentAdapter";
import { Rattachement, Critere } from "@/server/evaluation/queries/types";
import {
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

const getEtapeLabel = (etape: $Enums.etape_evaluation_enum): string => {
  switch (etape) {
    case $Enums.etape_evaluation_enum.AUTO_EVALUATION:
      return "Auto-évaluation";
    case $Enums.etape_evaluation_enum.CONSOLIDATION:
      return "Appréciation";
    case $Enums.etape_evaluation_enum.INSTRUCTION:
      return "Instruction";
    default:
      return "";
  }
};

type EvaluationsData = {
  rattachements: Rattachement[];
  criteres: Critere[];
};

export class EvaluationsAdapter implements PDFContentAdapter {
  constructor(
    private data: EvaluationsData,
    private etapeType: $Enums.etape_evaluation_enum,
  ) {}

  private getTitlePrefix(): string {
    return getEtapeLabel(this.etapeType);
  }

  private mapCriteresPageForRattachement(
    rattachement: Rattachement,
    isFirstRattachement: boolean,
  ): Content[] {
    return [
      createPageHeader({
        title: `${this.getTitlePrefix()} - Manière de servir - ${rattachement.code} - ${rattachement.libelle}`,
        pageBreak: isFirstRattachement ? undefined : "before",
      }),
      createTable(
        this.data.criteres.flatMap((critere) => {
          const critereRattachement = rattachement.criteres.find(
            (c) => c.id === critere.id,
          );

          if (!critereRattachement) {
            return [];
          }

          const rows = [
            [createSectionTitle({ title: critere.libelle, colSpan: 2 }), {}],
          ];

          critereRattachement.evaluations.forEach((evaluationData) => {
            const etapeLabel = getEtapeLabel(evaluationData.etape);
            rows.push([
              createText({
                text: createLabeledText({
                  label: etapeLabel,
                  text: evaluationData.evaluation.commentaire,
                }),
                margin: [5, 5, 5, 5],
              }),
              createScoreCell({
                score: formatterNote(evaluationData.evaluation.note),
              }),
            ]);
          });

          return rows;
        }),
        { rowModulo: 2, widths: ["*", 80] },
      ),
    ];
  }

  private mapObjectifsPageForRattachement(
    rattachement: Rattachement,
  ): Content[] {
    if (rattachement.objectifs.length === 0) {
      return [];
    }

    return [
      createPageHeader({
        title: `${this.getTitlePrefix()} - Objectifs - ${rattachement.code} - ${rattachement.libelle}`,
        pageBreak: "before",
      }),
      createTable(
        rattachement.objectifs.flatMap((objectif) => {
          const rows = [
            [createSectionTitle({ title: objectif.libelle, colSpan: 2 }), {}],
          ];

          objectif.evaluations.forEach((evaluationData) => {
            const etapeLabel = getEtapeLabel(evaluationData.etape);
            rows.push([
              createText({
                text: createLabeledText({
                  label: etapeLabel,
                  text: evaluationData.evaluation.commentaire,
                }),
                margin: [5, 5, 5, 5],
              }),
              createScoreCell({
                score: formatterNote(evaluationData.evaluation.note),
              }),
            ]);
          });

          return rows;
        }),
        { rowModulo: 2, widths: ["*", 80] },
      ),
    ];
  }

  private mapFichesCadragePageForRattachement(
    rattachement: Rattachement,
  ): Content[] {
    if (rattachement.objectifs.length === 0) {
      return [];
    }

    return [
      createPageHeader({
        title: `${this.getTitlePrefix()} - Fiches de cadrage - Manière de servir - ${rattachement.code} - ${rattachement.libelle}`,
        pageBreak: "before",
      }),
      createTable(
        rattachement.criteres.flatMap((evaluation) => {
          const critere = this.data.criteres.find(
            ({ id }) => id === evaluation.id,
          );
          if (!critere) return [];

          return [
            [createSectionTitle({ title: critere.libelle })],
            [
              createText({
                text: createLabeledText({
                  label: "Descriptif",
                  text: critere.descriptif,
                }),
                margin: [5, 5, 5, 5],
              }),
            ],
          ];
        }),
        { rowModulo: 2, widths: ["*"] },
      ),
    ];
  }

  getContent(): Content[] {
    const content: Content[] = [];

    this.data.rattachements.forEach((rattachement, index) => {
      content.push(
        ...this.mapCriteresPageForRattachement(rattachement, index === 0),
      );
      content.push(...this.mapObjectifsPageForRattachement(rattachement));
      content.push(...this.mapFichesCadragePageForRattachement(rattachement));
    });

    return content;
  }
}
