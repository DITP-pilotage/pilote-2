import { tool } from "ai";
import { z } from "zod";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import {
  PERIMETRES_HISTORIQUE,
  prepareHistoriqueIndicateurTerritoire,
  type EvenementHistoriquePresente,
} from "@/server/albert/tools/prepareHistoriqueIndicateurTerritoire";

export const getHistoriqueIndicateurTerritoireInputSchema = z.object({
  indicateur_id: z
    .string()
    .describe("Identifiant de l'indicateur (ex: IND-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  perimetre: z
    .enum(PERIMETRES_HISTORIQUE)
    .optional()
    .default("valeur_affichee")
    .describe(
      "`valeur_affichee` (défaut) : uniquement les événements qui ont changé la valeur affichée dans PILOTE (imports, propositions acceptées) — pour « qu'est-ce qui s'est passé sur cet indicateur », « pourquoi cette valeur a changé ». " +
        "`propositions` : uniquement le cycle de vie des propositions du territoire (créée, modifiée, refusée, acceptée, accusé de réception...) — pour les questions sur le statut d'une proposition. " +
        "`tout` : tous les événements sans filtre — à réserver aux questions qui ne rentrent dans aucun des deux cas précédents, car plus coûteux en volumétrie.",
    ),
  date_debut: z
    .string()
    .optional()
    .describe(
      "Borne basse (incluse) sur la période concernée par la valeur, au format YYYY-MM-DD. Omettre pour ne pas borner.",
    ),
  date_fin: z
    .string()
    .optional()
    .describe(
      "Borne haute (incluse) sur la période concernée par la valeur, au format YYYY-MM-DD. Omettre pour ne pas borner.",
    ),
});

export type GetHistoriqueIndicateurTerritoireOutput = {
  territoire_code: string;
  evenements: EvenementHistoriquePresente[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente les événements sous forme de récit chronologique (du plus récent au plus ancien), en t'appuyant sur le champ \`libelle\` sans en dénaturer le sens (valeur, motif). N'invente jamais un statut ou une valeur absent des données. Une liste vide signifie qu'aucun événement ne correspond au périmètre/à la plage demandés — dis-le clairement plutôt que de supposer.`;

export function createGetHistoriqueIndicateurTerritoireTool({
  indicateurTerritoireValeurEvenementRepository,
}: {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère le récit des événements survenus sur la valeur d'avancement d'un indicateur pour un territoire donné : imports de données, propositions du territoire et décisions de la direction de projet, avec leur motif quand disponible.

⚠️ Ne sert PAS à connaître la tendance ou la progression d'une valeur dans le temps — pour ça, utilise get_evolution_indicateur_territoire.

Utilise cet outil quand l'utilisateur demande :
- Ce qui s'est passé sur un indicateur (imports, modifications, suppressions)
- Le statut d'une proposition de valeur (en attente, refusée, acceptée)
- Le motif ou la source d'une valeur
- Quand une valeur a été mise à jour pour la dernière fois

Utilise \`perimetre\` pour limiter le volume retourné à l'intention de la question plutôt que de tout demander par défaut. Utilise \`date_debut\`/\`date_fin\` pour borner une période plutôt que de récupérer tout l'historique quand la question porte sur une fenêtre précise.`,
      inputSchema: getHistoriqueIndicateurTerritoireInputSchema,
      execute: async (
        input,
      ): Promise<GetHistoriqueIndicateurTerritoireOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const evenements =
          await indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode(
            {
              indicId: input.indicateur_id,
              territoireCode: input.territoire_code,
            },
          );

        const evenementsPresentes = prepareHistoriqueIndicateurTerritoire(
          evenements,
          {
            perimetre: input.perimetre,
            dateDebut: input.date_debut
              ? new Date(input.date_debut)
              : undefined,
            dateFin: input.date_fin ? new Date(input.date_fin) : undefined,
          },
        );

        return {
          territoire_code: input.territoire_code,
          evenements: evenementsPresentes,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
