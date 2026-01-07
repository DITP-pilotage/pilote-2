import {
  $Enums,
  etape_evaluation,
  evaluation_objectif,
  evaluation_critere,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { Transaction } from "@/server/db/Transaction";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export class SoumettreEtapeEvaluationService {
  constructor(
    private readonly dependencies: {
      transaction: Transaction;
      prisma: PrismaPilote;
    },
  ) {}

  async execute({
    ficheEvaluationId,
    auteurId,
    nomEtapeCourante,
    nomEtapeSuivante,
  }: {
    ficheEvaluationId: string;
    auteurId: string;
    nomEtapeCourante: $Enums.etape_evaluation_enum;
    nomEtapeSuivante: $Enums.etape_evaluation_enum;
  }) {
    const etapeCourante = await this.getEtapeCourante(
      ficheEvaluationId,
      nomEtapeCourante,
    );

    await this.dependencies.transaction.run(async () => {
      const existingEtapeSuivante = await this.getExistingEtapeSuivante(
        ficheEvaluationId,
        nomEtapeSuivante,
      );

      if (!existingEtapeSuivante) {
        await this.creerEtapeSuivante({
          auteurId,
          ficheEvaluationId,
          etapeSuivante: nomEtapeSuivante,
          etapeCourante,
        });
      } else {
        await this.mettreAJourEtapeSuivanteExistante({
          etapeCourante: etapeCourante,
          etapeSuivante: existingEtapeSuivante,
          auteurId,
        });
      }

      await this.setEtapeSuivante(ficheEvaluationId, nomEtapeSuivante);
    });
  }

  private async mettreAJourEtapeSuivanteExistante({
    etapeCourante,
    etapeSuivante,
    auteurId,
  }: {
    etapeCourante: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
    etapeSuivante: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
    auteurId: string;
  }) {
    for (const evaluation of etapeCourante.evaluations_objectifs) {
      const evaluationEtapeSuivante = etapeSuivante.evaluations_objectifs.find(
        (evalObj) => evalObj.objectif_id === evaluation.objectif_id,
      );

      if (!evaluationEtapeSuivante) {
        await this.prisma.evaluation_objectif.create({
          data: {
            id: randomUUID(),
            etape_evaluation_id: etapeSuivante.id,
            objectif_id: evaluation.objectif_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          },
        });
        continue;
      }

      if (evaluationEtapeSuivante.note == null) {
        await this.prisma.evaluation_objectif.update({
          where: { id: evaluationEtapeSuivante.id },
          data: { note: evaluation.note },
        });
      } else if (evaluationEtapeSuivante.note !== evaluation.note) {
        await this.prisma.evaluation_objectif.update({
          where: { id: evaluationEtapeSuivante.id },
          data: { date_traitement: null },
        });
      }
    }

    for (const evaluation of etapeCourante.evaluations_criteres) {
      const evaluationEtapeSuivante = etapeSuivante.evaluations_criteres.find(
        (evalCrit) => evalCrit.critere_id === evaluation.critere_id,
      );

      if (!evaluationEtapeSuivante) {
        await this.prisma.evaluation_critere.create({
          data: {
            id: randomUUID(),
            etape_evaluation_id: etapeSuivante.id,
            critere_id: evaluation.critere_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          },
        });
        continue;
      }

      if (evaluationEtapeSuivante.note == null) {
        await this.prisma.evaluation_critere.update({
          where: { id: evaluationEtapeSuivante.id },
          data: { note: evaluation.note },
        });
      } else if (evaluationEtapeSuivante.note !== evaluation.note) {
        await this.prisma.evaluation_critere.update({
          where: { id: evaluationEtapeSuivante.id },
          data: { date_traitement: null },
        });
      }
    }
  }

  private getExistingEtapeSuivante(
    ficheEvaluationId: string,
    etapeSuivante: $Enums.etape_evaluation_enum,
  ) {
    return this.prisma.etape_evaluation.findFirst({
      where: {
        fiche_evaluation_id: ficheEvaluationId,
        type: etapeSuivante,
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private creerEtapeSuivante({
    auteurId,
    ficheEvaluationId,
    etapeSuivante,
    etapeCourante,
  }: {
    auteurId: string;
    ficheEvaluationId: string;
    etapeSuivante: $Enums.etape_evaluation_enum;
    etapeCourante: etape_evaluation & {
      evaluations_objectifs: evaluation_objectif[];
      evaluations_criteres: evaluation_critere[];
    };
  }) {
    return this.prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id: ficheEvaluationId,
        type: etapeSuivante,
        evaluations_objectifs: {
          create: etapeCourante.evaluations_objectifs.map((evaluation) => ({
            id: randomUUID(),
            objectif_id: evaluation.objectif_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
        evaluations_criteres: {
          create: etapeCourante.evaluations_criteres.map((evaluation) => ({
            id: randomUUID(),
            critere_id: evaluation.critere_id,
            auteur_id: auteurId,
            note: evaluation.note,
            commentaire: "",
          })),
        },
      },
    });
  }

  private setEtapeSuivante(
    ficheEvaluationId: string,
    etapeSuivante: $Enums.etape_evaluation_enum,
  ) {
    return this.prisma.fiche_evaluation.update({
      where: { id: ficheEvaluationId },
      data: { etape_courante: etapeSuivante },
    });
  }

  private getEtapeCourante(
    ficheEvaluationId: string,
    etapeCourante: $Enums.etape_evaluation_enum,
  ) {
    return this.prisma.etape_evaluation.findFirstOrThrow({
      where: {
        type: etapeCourante,
        fiche_evaluation: {
          id: ficheEvaluationId,
          etape_courante: etapeCourante,
        },
      },
      include: {
        evaluations_objectifs: true,
        evaluations_criteres: true,
      },
    });
  }

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }
}
