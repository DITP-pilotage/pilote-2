import type { UIDataTypes, UIMessage } from "ai";
import type {
  DisplayChoice,
  ExportRapportOutput,
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
    input: {
      titre: string;
      date: string;
      resume: string;
      format?: "markdown" | "pdf";
      sections: Array<{
        titre: string;
        parties: Array<
          | { type: "paragraphe"; contenu: string }
          | { type: "tableau"; en_tetes: string[]; lignes: string[][] }
        >;
      }>;
    };
    output: ExportRapportOutput;
  };
};

export type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;
