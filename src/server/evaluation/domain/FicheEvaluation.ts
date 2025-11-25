import { $Enums } from "@prisma/client";

export interface FicheEvaluation {
  id: string;
  etapeCourante: $Enums.etape_evaluation_enum;
  readOnly: boolean;
  isObjectifsValides: boolean;
  isCriteresValides: boolean;
  rattachement: {
    code: string;
    libelle: string;
  };
  objectifs: {
    moyenne: number | null;
    moyennesParPhase: Partial<
      Record<$Enums.etape_evaluation_enum, number | null>
    >;
    nombreTraites: number;
    nombreNotes: number;
    nombreTotal: number;
  };
  criteres: {
    moyenne: number | null;
    moyennesParPhase: Partial<
      Record<$Enums.etape_evaluation_enum, number | null>
    >;
    nombreTraites: number;
    nombreNotes: number;
    nombreTotal: number;
  };
  noteCollective: number | null;
}
