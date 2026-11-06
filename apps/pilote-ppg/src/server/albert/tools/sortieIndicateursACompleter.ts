import type { JSONValue } from "ai";
import type { ClarifyWithChoicesOutput } from "@/server/albert/tools/clarifyWithChoices";
import type {
  LigneACompleter,
  Motif,
} from "@/server/albert/tools/indicateursACompleter";
import type { ResumeIndicateursACompleter } from "@/server/albert/tools/resumeIndicateursACompleter";
import type { ChampsAcces } from "@/server/albert/tools/socleValeursIndicateurs";

/**
 * La sortie de `get_indicateurs_a_completer` et ce qu'en lit le modèle. Sans
 * dépendance serveur : l'interface l'importe pour afficher la réponse brute.
 */

const CONSIGNE_PRECISION =
  "Les choix sont déjà affichés à l'utilisateur. N'appelle aucun autre outil, en particulier pas clarify_with_choices. Termine ta réponse par la seule phrase « Choisissez une option pour continuer. »";

const CONSIGNE_TABLEAU =
  "Le détail par territoire est affiché dans un tableau sous ta réponse. Termine ta réponse par une phrase qui y renvoie.";

export type DetailIndicateursACompleter = {
  motifs: Motif[];
  jalon?: number;
  perimetre: string;
  lignes: LigneACompleter[];
};

type ClarificationRenvoyee = ChampsAcces & {
  clarification: ClarifyWithChoicesOutput;
};

type DonneesRenvoyees = ChampsAcces & {
  resume: ResumeIndicateursACompleter;
  detail: DetailIndicateursACompleter;
};

export type GetIndicateursACompleterOutput =
  ClarificationRenvoyee | DonneesRenvoyees | ChampsAcces;

function estClarification(
  output: GetIndicateursACompleterOutput,
): output is ClarificationRenvoyee {
  return "clarification" in output;
}

function contientDesDonnees(
  output: GetIndicateursACompleterOutput,
): output is DonneesRenvoyees {
  return "resume" in output;
}

export function indicateursACompleterVersModele({
  output,
}: {
  output: GetIndicateursACompleterOutput;
}): { type: "json"; value: JSONValue } {
  if (estClarification(output)) {
    const { clarification: _clarification, ...champsAcces } = output;
    return {
      type: "json",
      value: {
        precision_demandee: true,
        consigne: CONSIGNE_PRECISION,
        ...champsAcces,
      },
    };
  }
  if (contientDesDonnees(output)) {
    const { resume, detail: _detail, ...champsAcces } = output;
    return {
      type: "json",
      value: {
        ...resume,
        ...(resume.chantiers.length > 0 && { consigne: CONSIGNE_TABLEAU }),
        ...champsAcces,
      },
    };
  }
  return { type: "json", value: output };
}
