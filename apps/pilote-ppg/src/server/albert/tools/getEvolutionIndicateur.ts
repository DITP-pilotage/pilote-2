import { tool } from "ai";
import { z } from "zod";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import { GetEvolutionIndicateurTerritoireQuery } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";
import type { PointEvolutionAvancement } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";

export const getEvolutionIndicateurInputSchema = z.object({
  indicateur_id: z
    .string()
    .describe("Identifiant canonique de l'indicateur (ex: IND-894)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetEvolutionIndicateurOutput = {
  indicateur: { id: string; nom: string; unite_mesure: string | null } | null;
  territoire_code?: string;
  points?: PointEvolutionAvancement[];
  introuvable?: true;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS =
  "Ces données représentent une ÉVOLUTION : la tendance dans le temps de la valeur d'avancement affichée dans PILOTE pour cet indicateur et ce territoire. Chaque point est daté au format MM/AAAA (mois de la valeur d'avancement) — reprends ce format tel quel, ne le recalcule pas. Présente-les comme une évolution/tendance, en citant le nom et l'unité de l'indicateur plutôt que des chiffres bruts. Si l'utilisateur veut le détail des actions ayant produit ces valeurs (qui a fait quoi, import, proposition, validation...), indique-lui simplement qu'il est possible d'obtenir ce détail, sans citer de nom d'outil technique.";

const INDICATEUR_INTROUVABLE_INSTRUCTIONS =
  "Cet indicateur est introuvable. Informe l'utilisateur qu'aucun indicateur ne correspond à cet identifiant.";

export function createGetEvolutionIndicateurTool({
  getIndicateurContexteQuery,
  getEvolutionIndicateurTerritoireQuery,
}: {
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
  getEvolutionIndicateurTerritoireQuery: GetEvolutionIndicateurTerritoireQuery;
}) {
  return () => {
    return tool({
      description: `Récupère l'évolution dans le temps de la valeur d'avancement d'un indicateur pour un territoire donné (série de points date/valeur).

Utilise cet outil quand l'utilisateur demande la tendance, la courbe, ou l'évolution d'un indicateur dans le temps.

⚠️ Ne renvoie PAS le détail des actions (import, proposition, validation...) — pour ça, utilise get_historique_indicateur.`,
      inputSchema: getEvolutionIndicateurInputSchema,
      execute: async (input): Promise<GetEvolutionIndicateurOutput> => {
        const contexte = await getIndicateurContexteQuery.execute({
          indicateurId: input.indicateur_id,
        });

        if (!contexte) {
          return {
            indicateur: null,
            introuvable: true,
            _output_instructions: INDICATEUR_INTROUVABLE_INSTRUCTIONS,
          };
        }

        const points = await getEvolutionIndicateurTerritoireQuery.execute({
          indicateurId: input.indicateur_id,
          territoireCode: input.territoire_code,
        });

        return {
          indicateur: {
            id: contexte.id,
            nom: contexte.nom,
            unite_mesure: contexte.uniteMesure,
          },
          territoire_code: input.territoire_code,
          points,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
