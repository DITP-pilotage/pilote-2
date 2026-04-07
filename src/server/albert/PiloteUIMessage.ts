import type { UIDataTypes, UIMessage } from "ai";
import type {
  DisplayChoice,
  ExportRapportOutput,
} from "@/server/albert/Albert";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantiersEnRetardOutput } from "@/server/albert/tools/getChantiersEnRetard";
import type { GetChantiersEnDifficulteOutput } from "@/server/albert/tools/getChantiersEnDifficulte";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";

export type PiloteUITools = {
  display_choices: {
    input: { question: string; choices: DisplayChoice[] };
    output: { question: string; choices: DisplayChoice[] };
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
  get_chantier_indicateurs: {
    input: {
      chantier_id: string;
      territoire_code: string;
      jalon: number;
      afficher?: boolean;
    };
    output: GetChantierIndicateursOutput;
  };
  export_rapport: {
    input: {
      nom_fichier: string;
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
