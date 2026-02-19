import { tool } from "ai";
import { z } from "zod";
import { GetSyntheseTerritoireQuery } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import type { GetSyntheseTerritoireResult } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import { JALON_COURANT } from "@/server/albert/systemPrompt";

export const SYNTHESE_TERRITOIRE_OUTPUT_FORMAT = `
<instructions>
Remplace les variables entre {{ }} par les données réelles issues du résultat de l'outil get_synthese_territoire.
Pour la liste des chantiers, ne reproduis pas les commentaires bruts : rédige un résumé pertinent de la situation de chaque chantier en lien avec les données observées (écart, météo, taux d'avancement).
Génère la réponse en markdown en suivant le gabarit ci-dessous. Les annotations (pour chaque ...) indiquent une itération sur les données.
N'utilise JAMAIS de tableaux pour présenter la donnée.
</instructions>

<template>
# Synthèse pour {{territoire_nom}}

Dans Pilote, le TA {{JALON}} de la région s'établit à {{taux_avancement_global}}%, pour une médiane nationale à {{mediane_repartition}}%.

## Chantiers en retard

{{X}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale :

(pour chaque chantier_en_retard)
- **{{chantier.id}} — {{chantier.nom}}**
  Écart : {{ecart}} points · Météo : {{synthese.meteo}}
  Résumé de la situation

## Chantiers en difficulté

{{Y}} chantiers sont compromis ou nécessitent un appui :

(pour chaque chantier_en_difficulte)
- **{{chantier.id}} — {{chantier.nom}}**
  Météo : {{meteo}}
  Résumé de la situation

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.
</template>
`;

const getSyntheseTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetSyntheseTerritoireOutput = GetSyntheseTerritoireResult;

export function createGetSyntheseTerritoireTool({
  getSyntheseTerritoireQuery,
}: {
  getSyntheseTerritoireQuery: GetSyntheseTerritoireQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère la synthèse détaillée d'un territoire. Cet outil retourne :
- Le taux d'avancement global du territoire
- La position du territoire par rapport à la médiane de répartition
- Les chantiers en retard (écart <= -10) avec leurs métriques détaillées
- Les chantiers en difficulté (météo ORAGE ou NUAGE) avec leurs synthèses

Utilise cet outil quand l'utilisateur demande :
- Une analyse d'un territoire spécifique
- Une comparaison territoriale
- Des détails sur les chantiers problématiques d'un territoire`,
      inputSchema: getSyntheseTerritoireInputSchema,
      execute: async (input): Promise<GetSyntheseTerritoireOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        return getSyntheseTerritoireQuery.execute({
          territoireCode: input.territoire_code,
          jalon: JALON_COURANT,
        });
      },
    });
  };
}
