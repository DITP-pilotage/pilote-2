import type { UIDataTypes, UIMessage } from "ai";
import type {
  DisplayChoice,
  ExportRapportOutput,
  ValeursIndicateurDisplay,
} from "@/server/albert/Albert";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantiersEnRetardOutput } from "@/server/albert/tools/getChantiersEnRetard";
import type { GetChantiersEnDifficulteOutput } from "@/server/albert/tools/getChantiersEnDifficulte";
import type { GetValeursIndicateurOutput } from "@/server/albert/tools/getValeursIndicateur";

export type PiloteUITools = {
  display_choices: {
    input: { choices: DisplayChoice[] };
    output: { choices: DisplayChoice[] };
  };
  display_valeurs_indicateur: {
    input: { indicateurs: ValeursIndicateurDisplay[] };
    output: { indicateurs: ValeursIndicateurDisplay[] };
  };
  get_taux_avancement_territoire: {
    input: { territoire_code: string; jalon: number };
    output: GetTauxAvancementTerritoireOutput;
  };
  get_chantiers_en_retard: {
    input: { territoire_code: string; jalon: number };
    output: GetChantiersEnRetardOutput;
  };
  get_chantiers_en_difficulte: {
    input: { territoire_code: string; jalon: number };
    output: GetChantiersEnDifficulteOutput;
  };
  get_valeurs_indicateur: {
    input: { chantier_id: string; territoire_code: string };
    output: GetValeursIndicateurOutput;
  };
  export_rapport: {
    input: { contenu: string };
    output: ExportRapportOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
