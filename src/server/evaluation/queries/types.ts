import { $Enums } from "@prisma/client";

export type SousCritere = {
  id: string;
  libelle: string;
  descriptif: string;
};

export type Critere = {
  id: string;
  libelle: string;
  descriptif: string;
  sousCriteres: Array<SousCritere>;
};

export type Evaluation = {
  id: string;
  note: number | null;
  commentaire: string;
  annexe: string | null;
};

export type Objectif = {
  id: string;
  libelle: string;
  descriptif: string;
  indicateurCible: string;
  evaluations: Array<{
    etape: $Enums.etape_evaluation_enum;
    evaluation: Evaluation;
    dateTraitement: string | null;
  }>;
};

export type Rattachement = {
  code: string;
  libelle: string;
  ficheEvaluationId: string;
  dateDerniereModification: string | null;
  readOnly: boolean;
  etapeCourante: $Enums.etape_evaluation_enum;
  objectifs: Array<Objectif>;
  criteres: Array<{
    id: string;
    evaluations: Array<{
      etape: $Enums.etape_evaluation_enum;
      evaluation: Evaluation;
      dateTraitement: string | null;
    }>;
  }>;
};
