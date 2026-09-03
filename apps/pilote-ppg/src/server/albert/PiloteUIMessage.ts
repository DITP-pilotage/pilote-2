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
  getChantiersSignalesInputSchema,
  type GetChantiersSignalesOutput,
} from "@/server/albert/tools/getChantiersSignales";
import {
  getChantierIndicateursInputSchema,
  type GetChantierIndicateursOutput,
} from "@/server/albert/tools/getChantierIndicateurs";
import {
  getChantierCommentairesInputSchema,
  type GetChantierCommentairesOutput,
} from "@/server/albert/tools/getChantierCommentaires";
import {
  getChantierObjectifsInputSchema,
  type GetChantierObjectifsOutput,
} from "@/server/albert/tools/getChantierObjectifs";
import {
  searchChantiersInputSchema,
  type SearchChantiersOutput,
} from "@/server/albert/tools/searchChantiers";
import {
  searchIndicateursInputSchema,
  type SearchIndicateursOutput,
} from "@/server/albert/tools/searchIndicateurs";
import {
  searchTerritoiresInputSchema,
  type SearchTerritoiresOutput,
} from "@/server/albert/tools/searchTerritoires";

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
  get_chantiers_signales: {
    input: z.input<typeof getChantiersSignalesInputSchema>;
    output: GetChantiersSignalesOutput;
  };
  get_indicateurs: {
    input: z.input<typeof getChantierIndicateursInputSchema>;
    output: GetChantierIndicateursOutput;
  };
  get_chantier_commentaires: {
    input: z.input<typeof getChantierCommentairesInputSchema>;
    output: GetChantierCommentairesOutput;
  };
  get_chantier_objectifs: {
    input: z.input<typeof getChantierObjectifsInputSchema>;
    output: GetChantierObjectifsOutput;
  };
  search_chantiers: {
    input: z.input<typeof searchChantiersInputSchema>;
    output: SearchChantiersOutput;
  };
  search_indicateurs: {
    input: z.input<typeof searchIndicateursInputSchema>;
    output: SearchIndicateursOutput;
  };
  search_territoires: {
    input: z.input<typeof searchTerritoiresInputSchema>;
    output: SearchTerritoiresOutput;
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
