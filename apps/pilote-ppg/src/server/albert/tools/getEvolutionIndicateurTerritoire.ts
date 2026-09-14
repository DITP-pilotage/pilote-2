import { tool } from "ai";
import { z } from "zod";
import { RecupererEvolutionValeursAvancementTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererEvolutionValeursAvancementTerritoiresQuery";
import { RecupererChantierIdParIndicateurIdQuery } from "@/server/chantiers/query/RecupererChantierIdParIndicateurIdQuery";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export const getEvolutionIndicateurTerritoireInputSchema = z.object({
  indicateur_id: z
    .string()
    .describe("Identifiant de l'indicateur (ex: IND-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
});

export type GetEvolutionIndicateurTerritoireOutput = {
  territoire_code: string;
  jalon: number;
  points: { date: string; valeur: number }[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente l'évolution dans l'ordre chronologique (ex: "passée de 18 au 01/05 à 23 au 01/12"). Une liste de points vide signifie qu'aucune valeur n'a été enregistrée sur ce territoire pour ce jalon — dis-le clairement plutôt que de supposer une valeur.`;

export function createGetEvolutionIndicateurTerritoireTool({
  recupererEvolutionValeursAvancementTerritoiresQuery,
  recupererChantierIdParIndicateurIdQuery,
}: {
  recupererEvolutionValeursAvancementTerritoiresQuery: RecupererEvolutionValeursAvancementTerritoiresQuery;
  recupererChantierIdParIndicateurIdQuery: RecupererChantierIdParIndicateurIdQuery;
}) {
  return ({
    chantiersAccessibles,
    habilitations,
    profil,
  }: {
    chantiersAccessibles: string[];
    habilitations: Habilitations;
    profil: ProfilCode;
  }) => {
    return tool({
      description: `Récupère l'évolution dans le temps de la valeur d'avancement affichée dans PILOTE pour un indicateur sur un territoire, pour un jalon donné (une liste de points {date, valeur}).

Utilise cet outil quand l'utilisateur demande :
- Comment un indicateur a évolué dans le temps
- La tendance ou la progression d'une valeur d'avancement
- La valeur d'un indicateur à une date donnée

Le chantier de rattachement est résolu automatiquement depuis \`indicateur_id\` : inutile de le connaître ou de le demander à l'utilisateur.

⚠️ Ne retourne PAS le détail des imports, propositions ou modifications qui ont produit ces valeurs — pour ça, utilise get_historique_indicateur_territoire.`,
      inputSchema: getEvolutionIndicateurTerritoireInputSchema,
      execute: async (
        input,
      ): Promise<GetEvolutionIndicateurTerritoireOutput> => {
        const chantierId = await recupererChantierIdParIndicateurIdQuery.execute(
          input.indicateur_id,
        );

        if (chantierId === null) {
          throw new Error(`Indicateur inconnu : ${input.indicateur_id}`);
        }

        if (!chantiersAccessibles.includes(chantierId)) {
          throw new Error(`Accès non autorisé au chantier ${chantierId}`);
        }

        const result =
          await recupererEvolutionValeursAvancementTerritoiresQuery.execute({
            indicateurId: input.indicateur_id,
            chantierId,
            jalon: input.jalon,
            habilitations,
            profil,
          });

        const territoire = result.territoires.find(
          (t) => t.territoireCode === input.territoire_code,
        );

        return {
          territoire_code: input.territoire_code,
          jalon: input.jalon,
          points: territoire?.historiquesValeurs ?? [],
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
