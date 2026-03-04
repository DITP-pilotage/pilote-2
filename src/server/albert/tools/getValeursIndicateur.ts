import { tool } from "ai";
import { z } from "zod";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import type { GetValeursIndicateurResult } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { JALON_COURANT } from "@/server/albert/systemPrompt";

export const VALEURS_INDICATEUR_OUTPUT_FORMAT = `
<instructions>
Remplace les variables entre {{ }} par les données réelles issues du résultat de l'outil get_valeurs_indicateur.
Génère la réponse en markdown en suivant le gabarit ci-dessous. Les annotations (pour chaque ...) indiquent une itération sur les données.
N'utilise JAMAIS de tableaux pour présenter la donnée.
Si une valeur est nulle, écris "Non renseigné".
</instructions>

<template>
# Indicateurs du chantier {{chantier_id}} sur {{territoire_code}}

(pour chaque indicateur)
## {{nom}}{{#si unite_mesure}} ({{unite_mesure}}){{/si}}

- **Valeur initiale** : {{valeur_initiale}} ({{date_valeur_initiale}})
- **Valeur actuelle** : {{valeur_actuelle}} ({{date_valeur_actuelle}})
- **Valeur cible** : {{valeur_cible}} ({{date_valeur_cible}})
- **Taux d'avancement** : {{taux_avancement}}%

Sources analysées : données quantitatives des indicateurs publiés sur PILOTE.
</template>
`;

const getValeursIndicateurInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetValeursIndicateurOutput = GetValeursIndicateurResult;

export function createGetValeursIndicateurTool({
  getValeursIndicateurQuery,
}: {
  getValeursIndicateurQuery: GetValeursIndicateurQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les valeurs des indicateurs (VI, VA, VC, TA) d'un chantier sur un territoire donné. Cet outil retourne :
- La valeur initiale (VI) et sa date
- La valeur actuelle (VA) et sa date
- La valeur cible (VC) et sa date
- Le taux d'avancement (TA)

Utilise cet outil quand l'utilisateur demande :
- Les indicateurs d'un chantier spécifique sur un territoire
- L'état d'avancement détaillé d'un chantier (VA, VC, TA)
- Une comparaison entre la valeur actuelle et la cible d'un chantier`,
      inputSchema: getValeursIndicateurInputSchema,
      execute: async (input): Promise<GetValeursIndicateurOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        return getValeursIndicateurQuery.execute({
          territoireCode: input.territoire_code,
          chantierId: input.chantier_id,
          jalon: JALON_COURANT,
        });
      },
    });
  };
}
