import { tool } from "ai";
import { z } from "zod";

const getSyntheseTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

type ChantierIdentiteSynthese = {
  id: string; // CH-XXX
  nom: string;
  axe: string;
  ppg: string;
  ministeres: string[]; // acronymes
};

type SyntheseResultat = {
  meteo: string | null;
  commentaire: string | null;
  date_meteo: string | null;
  date_commentaire: string | null;
};

type ChantierEnRetard = {
  chantier: ChantierIdentiteSynthese;
  ecart: number; // always <= -10
  taux_avancement: number | null;
  synthese: SyntheseResultat | null; // most recent for jalon
};

type ChantierEnDifficulte = {
  chantier: ChantierIdentiteSynthese;
  meteo: "ORAGE" | "NUAGE";
  ecart: number | null;
  taux_avancement: number | null;
  synthese: SyntheseResultat | null;
};

export type GetSyntheseTerritoireOutput = {
  territoire_code: string;
  territoire_nom: string;
  taux_avancement_global: number | null; // TA moyen du territoire
  mediane_repartition: number | null; // médiane de la répartition
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
  chantiers_en_retard: ChantierEnRetard[]; // écart <= -10, sorted worst first
  chantiers_en_difficulte: ChantierEnDifficulte[]; // ORAGE/NUAGE, excluding list 1
};

interface CreateGetSyntheseTerritoireToolParams {
  territoiresAccessibles: string[];
}

export function createGetSyntheseTerritoireTool({
  territoiresAccessibles,
}: CreateGetSyntheseTerritoireToolParams) {
  return tool({
    description:
      "Récupère la synthèse détaillée d'un territoire avec ses chantiers en retard et en difficulté",
    inputSchema: getSyntheseTerritoireInputSchema,
    execute: async (input): Promise<GetSyntheseTerritoireOutput> => {
      // Validate territory access
      if (!territoiresAccessibles.includes(input.territoire_code)) {
        throw new Error(
          `Accès non autorisé au territoire ${input.territoire_code}`,
        );
      }

      // Stub implementation
      throw new Error("Not implemented");
    },
  });
}
