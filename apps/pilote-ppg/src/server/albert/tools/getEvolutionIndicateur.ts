import { tool } from "ai";
import { z } from "zod";
import { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import { GetEvolutionIndicateurTerritoireQuery } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";
import type { PointEvolutionAvancement } from "@/server/chantiers/query/GetEvolutionIndicateurTerritoireQuery";
import { expliquerConstructionValeurAffichee } from "@/server/albert/tools/expliquerConstructionValeurAffichee";

export const getEvolutionIndicateurInputSchema = z.object({
  indicateur_id: z
    .string()
    .describe("Identifiant canonique de l'indicateur (ex: IND-894)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetEvolutionIndicateurOutput = {
  indicateur: {
    id: string;
    nom: string;
    unite_mesure: string | null;
    chantier_id: string;
  } | null;
  territoire_code?: string;
  construction_valeur_affichee?: string;
  points?: PointEvolutionAvancement[];
  introuvable?: true;
};

export function createGetEvolutionIndicateurTool({
  getIndicateurContexteQuery,
  getEvolutionIndicateurTerritoireQuery,
}: {
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
  getEvolutionIndicateurTerritoireQuery: GetEvolutionIndicateurTerritoireQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie l'évolution dans le temps de la valeur d'avancement d'un indicateur sur un territoire, et du taux d'avancement quand il est disponible : une série de points datés (mois/année).
- \`introuvable\` : aucun indicateur ne porte cet identifiant.
- \`construction_valeur_affichee\` : comment PILOTE construit la valeur affichée à partir des valeurs importées (un cumul, par exemple). Ne recalcule jamais les valeurs toi-même.
Utilise-le pour : la tendance, la progression ou l'évolution d'un indicateur dans le temps (« comment évolue l'IND-894 ? », « l'indicateur progresse-t-il ? »).
Ne l'utilise pas pour :
- afficher une courbe ou un graphique → create_dashboard ;
- le détail des actions sur la valeur (import, proposition, validation) → get_historique_indicateur.`,
      inputSchema: getEvolutionIndicateurInputSchema,
      execute: async (input): Promise<GetEvolutionIndicateurOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const contexte = await getIndicateurContexteQuery.execute({
          indicateurId: input.indicateur_id,
        });

        if (!contexte) {
          return {
            indicateur: null,
            introuvable: true,
          };
        }

        if (!chantiersAccessibles.includes(contexte.chantier.id)) {
          throw new Error(
            `Accès non autorisé au chantier ${contexte.chantier.id}`,
          );
        }

        const points = await getEvolutionIndicateurTerritoireQuery.execute({
          indicateurId: input.indicateur_id,
          territoireCode: input.territoire_code,
        });

        const explicationValeurAffichee = expliquerConstructionValeurAffichee(
          contexte.parametrageValeurAffichee,
        );

        return {
          indicateur: {
            id: contexte.id,
            nom: contexte.nom,
            unite_mesure: contexte.uniteMesure,
            chantier_id: contexte.chantier.id,
          },
          territoire_code: input.territoire_code,
          ...(explicationValeurAffichee && {
            construction_valeur_affichee: explicationValeurAffichee,
          }),
          points,
        };
      },
    });
  };
}
