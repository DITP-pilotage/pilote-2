import type { UIDataTypes, UIMessage } from "ai";
import type { DisplayChoice } from "@/server/albert/Albert";
import type { GetSyntheseTerritoireOutput } from "@/server/albert/tools/getSyntheseTerritoire";

export type PiloteUITools = {
  display_choices: {
    input: { choices: DisplayChoice[] };
    output: { choices: DisplayChoice[] };
  };
  get_synthese_territoire: {
    input: { territoire_code: string };
    output: GetSyntheseTerritoireOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
