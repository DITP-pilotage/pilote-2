import { tool } from "ai";
import { z } from "zod";
import { GetSyntheseTerritoireQuery } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import type { GetSyntheseTerritoireResult } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import { JALON_COURANT } from "@/server/albert/systemPrompt";

export const SYNTHESE_TERRITOIRE_OUTPUT_FORMAT = `
<instructions>
Remplace les variables entre {{ }} par les données réelles issues du résultat de l'outil get_synthese_territoire.
Pour la liste des chantiers, ne reproduis pas les commentaires bruts : rédige un résumé pertinent de la situation de chaque chantier en lien avec les données observées (écart, météo, taux d'avancement).
</instructions>

<template>
Synthèse pour {{Nom du territoire}}

Dans Pilote, le TA {{JALON}} de la région s'établit à {{TA_POURCENTAGE_TERRITOIRE}}, pour une médiane nationale à {{TA_POURCENTAGE_NATIONALE}}.

{{X}} chantiers sont en retard de plus de 10 points par rapport à la médiane nationale :

{{Liste des chantiers - inclut leur ID, écart, nom, météo et un résumé de la situation}}

{{Y}} chantiers sont compromis ou nécessitent un appui.

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
