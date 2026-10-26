import { tool } from "ai";
import { z } from "zod";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import type {
  TauxAvancementTerritoireReader,
  TauxAvancementTerritoireResult,
} from "@/server/albert/services/TauxAvancementTerritoireReader";

export const getTauxAvancementTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Mets `true` quand la demande couvre un territoire ET ses sous-territoires " +
        "(ex: « la région X et ses départements », « la région X et les départements qui la composent », " +
        "« détaille par département », « décomposé par sous-territoire »). " +
        "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
        "plutôt que d'énumérer chaque sous-territoire avec des appels séparés.",
    ),
});

export type GetTauxAvancementTerritoireResult = TauxAvancementTerritoireResult;

export type GetTauxAvancementTerritoireOutput = {
  resultats: GetTauxAvancementTerritoireResult[];
  _output_instructions: string;
};

function getOutputInstructions(): string {
  return `Présente le TA, la médiane et la position pour chaque territoire. Un seul territoire → paragraphe factuel. Plusieurs territoires → tableau comparatif.`;
}

export function createGetTauxAvancementTerritoireTool({
  tauxAvancementTerritoireReader,
}: {
  tauxAvancementTerritoireReader: TauxAvancementTerritoireReader;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    return tool({
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la médiane.
Quand include_sous_territoires=true, retourne aussi les données de chaque sous-territoire.

⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel sur le territoire parent avec include_sous_territoires=true, plutôt que N appels
individuels sur chaque sous-territoire.

Utilise cet outil quand l'utilisateur demande :
- Le taux d'avancement d'un territoire
- La position d'un territoire par rapport à la médiane
- Une vue d'ensemble rapide d'un territoire (ex: « où en est la France sur l'ensemble des chantiers ? »)`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: async (input): Promise<GetTauxAvancementTerritoireOutput> => {
        const resultats = await tauxAvancementTerritoireReader.execute(
          {
            territoireCode: input.territoire_code,
            jalon: input.jalon,
            includeSousTerritoires: input.include_sous_territoires,
          },
          habilitations,
        );

        return {
          resultats,
          _output_instructions: getOutputInstructions(),
        };
      },
    });
  };
}
