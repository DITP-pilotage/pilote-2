import type { UIDataTypes, UIMessage } from "ai";
import type { z } from "zod";
import {
  displayChoicesInputSchema,
  type DisplayChoice,
} from "@/server/albert/tools/displayChoices";
import {
  exportRapportInputSchema,
  type ExportRapportOutput,
} from "@/server/albert/exportRapportSchema";
import {
  createDashboardInputSchema,
  type CreateDashboardOutput,
} from "@/server/albert/tools/createDashboard";
import {
  getTauxAvancementTerritoireInputSchema,
  type GetTauxAvancementTerritoireOutput,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import {
  getChantiersInputSchema,
  type GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import {
  getChantierIndicateursInputSchema,
  type GetChantierIndicateursOutput,
} from "@/server/albert/tools/getChantierIndicateurs";
import {
  getChantierCommentairesInputSchema,
  type GetChantierCommentairesOutput,
} from "@/server/albert/tools/getChantierCommentaires";
import {
  searchChantiersInputSchema,
  type SearchChantiersOutput,
} from "@/server/albert/tools/searchChantiers";

export type PiloteUITools = {
  display_choices: {
    input: z.input<typeof displayChoicesInputSchema>;
    output: { question: string; choices: DisplayChoice[] };
  };
  get_taux_avancement_territoire: {
    input: z.input<typeof getTauxAvancementTerritoireInputSchema>;
    output: GetTauxAvancementTerritoireOutput;
  };
  get_chantiers: {
    input: z.input<typeof getChantiersInputSchema>;
    output: GetChantiersOutput;
  };
  get_indicateurs: {
    input: z.input<typeof getChantierIndicateursInputSchema>;
    output: GetChantierIndicateursOutput;
  };
  get_chantier_commentaires: {
    input: z.input<typeof getChantierCommentairesInputSchema>;
    output: GetChantierCommentairesOutput;
  };
  search_chantiers: {
    input: z.input<typeof searchChantiersInputSchema>;
    output: SearchChantiersOutput;
  };
  create_dashboard: {
    input: z.input<typeof createDashboardInputSchema>;
    output: CreateDashboardOutput;
  };
  export_rapport: {
    input: z.input<typeof exportRapportInputSchema>;
    output: ExportRapportOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
