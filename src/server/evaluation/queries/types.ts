import { $Enums } from "@prisma/client";

export type Critere = { id: string; libelle: string };

export type Evaluation = {
  id: string;
  note: number | null;
  commentaire: string;
};

export type Rattachement = {
  code: string;
  libelle: string;
  ficheEvaluationId: string;
  readOnly: boolean;
  objectifs: Array<{
    id: string;
    libelle: string;
    evaluations: Array<{
      etape: $Enums.etape_evaluation_enum;
      evaluation: Evaluation;
    }>;
  }>;
  criteres: Array<{
    id: string;
    libelle: string;
    evaluations: Array<{
      etape: $Enums.etape_evaluation_enum;
      evaluation: Evaluation;
    }>;
  }>;
};
