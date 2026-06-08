import { type $Enums } from "@prisma/client";

export type IndicateurIdentite = {
  nom: string;
  maillesApplicables: $Enums.Maille[];
};

export interface IndicateurIdentiteRepository {
  findById(id: string): Promise<IndicateurIdentite | null>;
}
