import { $Enums } from "@prisma/client";

export type Critere = { id: string; libelle: string };

export type Evaluation = {
  id: string;
  note: number | null;
  commentaire: string;
};

export type Objectif = {
  id: string;
  libelle: string;
  evaluations: Array<{
    etape: $Enums.etape_evaluation_enum;
    evaluation: Evaluation;
  }>;
};
export type Rattachement = {
  code: string;
  libelle: string;
  ficheEvaluationId: string;
  readOnly: boolean;
  objectifs: Array<Objectif>;
  criteres: Array<{
    id: string;
    evaluations: Array<{
      etape: $Enums.etape_evaluation_enum;
      evaluation: Evaluation;
    }>;
  }>;
};
