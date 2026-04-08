import type { UIDataTypes, UIMessage } from "ai";
import type { z } from "zod";
import { displayChoicesInputSchema } from "@/server/albert/Albert";
import type { DisplayChoice } from "@/server/albert/Albert";
import {
  exportRapportInputSchema,
  type ExportRapportOutput,
} from "@/server/albert/exportRapportSchema";
import {
  getTauxAvancementTerritoireInputSchema,
  type GetTauxAvancementTerritoireOutput,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import {
  getChantiersEnRetardInputSchema,
  type GetChantiersEnRetardOutput,
} from "@/server/albert/tools/getChantiersEnRetard";
import {
  getChantiersEnDifficulteInputSchema,
  type GetChantiersEnDifficulteOutput,
} from "@/server/albert/tools/getChantiersEnDifficulte";
import {
  getChantierIndicateursInputSchema,
  type GetChantierIndicateursOutput,
} from "@/server/albert/tools/getChantierIndicateurs";

export type PiloteUITools = {
  display_choices: {
    input: z.input<typeof displayChoicesInputSchema>;
    output: { question: string; choices: DisplayChoice[] };
  };
  get_taux_avancement_territoire: {
    input: z.input<typeof getTauxAvancementTerritoireInputSchema>;
    output: GetTauxAvancementTerritoireOutput;
  };
  get_chantiers_en_retard: {
    input: z.input<typeof getChantiersEnRetardInputSchema>;
    output: GetChantiersEnRetardOutput;
  };
  get_chantiers_en_difficulte: {
    input: z.input<typeof getChantiersEnDifficulteInputSchema>;
    output: GetChantiersEnDifficulteOutput;
  };
  get_chantier_indicateurs: {
    input: z.input<typeof getChantierIndicateursInputSchema>;
    output: GetChantierIndicateursOutput;
  };
  export_rapport: {
    input: z.input<typeof exportRapportInputSchema>;
    output: ExportRapportOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
