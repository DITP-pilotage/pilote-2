import { $Enums } from "@prisma/client";

export interface FicheEvaluation {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  objectifsValides: boolean;
  criteresValides: boolean;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    nombreNotes: number;
    nombreTotal: number;
  };
  noteCollective: number | null;
}
