import type { UIDataTypes, UIMessage } from "ai";
import type { DisplayChoice } from "@/server/albert/Albert";
import type { GetSyntheseTerritoireOutput } from "@/server/albert/tools/getSyntheseTerritoire";
import type { GetValeursIndicateurOutput } from "@/server/albert/tools/getValeursIndicateur";

export type PiloteUITools = {
  display_choices: {
    input: { choices: DisplayChoice[] };
    output: { choices: DisplayChoice[] };
  };
  get_synthese_territoire: {
    input: { territoire_code: string };
    output: GetSyntheseTerritoireOutput;
  };
  get_valeurs_indicateur: {
    input: { chantier_id: string; territoire_code: string };
    output: GetValeursIndicateurOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
