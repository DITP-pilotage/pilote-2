import { z } from "zod";
import type { Perimetre } from "@/server/albert/domain/Perimetre";

/**
 * Une variante de périmètre par type. Chaque outil compose sa
 * `z.discriminatedUnion("type", [...])` avec les seules variantes qu'il
 * accepte : le LLM ne voit jamais une variante qu'il n'a pas le droit
 * d'utiliser.
 *
 * `z.enum` plutôt que `z.literal` : le JSON Schema porte alors un `enum`, que
 * gpt-oss lit, et non un `const`, qu'il ignorait (près d'un premier appel sur
 * deux inventait son `type`). Les variantes n'ont pas de description : il
 * recopiait « Toutes les régions » dans le `type`. Le sens de chaque type vit
 * dans `descriptionPerimetre`.
 */
export const variantesPerimetre = {
  SELECTION: z.object({
    type: z.enum(["SELECTION"]),
    territoire_codes: z
      .array(z.string())
      .min(1)
      .describe("Codes des territoires (ex: ['DEPT-59', 'REG-53', 'NAT-FR'])"),
  }),
  REGION_ET_SES_DEPARTEMENTS: z.object({
    type: z.enum(["REGION_ET_SES_DEPARTEMENTS"]),
    region_code: z
      .string()
      .regex(/^REG-/)
      .describe("Code de la région (ex: REG-53)"),
  }),
  FRANCE_ET_SES_REGIONS: z.object({
    type: z.enum(["FRANCE_ET_SES_REGIONS"]),
  }),
  TOUTES_REGIONS: z.object({ type: z.enum(["TOUTES_REGIONS"]) }),
  TOUS_DEPARTEMENTS: z.object({ type: z.enum(["TOUS_DEPARTEMENTS"]) }),
} satisfies {
  [Type in Perimetre["type"]]: z.ZodType<Extract<Perimetre, { type: Type }>>;
};

const SENS_DES_TYPES: Record<Perimetre["type"], string> = {
  SELECTION:
    "SELECTION, avec territoire_codes : des territoires précis, désignés par leurs codes. Un territoire seul, région comprise (« en Bretagne », « la Normandie »), est une SELECTION de son seul code : ses départements n'en font pas partie",
  REGION_ET_SES_DEPARTEMENTS:
    "REGION_ET_SES_DEPARTEMENTS, avec region_code : une région et tous ses départements, seulement quand la demande cite les départements (« la Bretagne et ses départements », « les départements bretons », « détaille par département ») ; jamais pour une région seule",
  FRANCE_ET_SES_REGIONS:
    "FRANCE_ET_SES_REGIONS, sans autre champ : la France (NAT-FR) et toutes ses régions",
  TOUTES_REGIONS:
    "TOUTES_REGIONS, sans autre champ : toutes les régions, sans la France",
  TOUS_DEPARTEMENTS:
    "TOUS_DEPARTEMENTS, sans autre champ : tous les départements",
};

/** La description du `perimetre` d'un outil, qui liste les seuls types qu'il accepte. */
export function descriptionPerimetre({
  types,
}: {
  types: Perimetre["type"][];
}): string {
  return [
    "Les territoires visés, en un seul appel : jamais un appel par territoire. `type` vaut exactement l'une de ces valeurs :",
    ...types.map((type) => `- ${SENS_DES_TYPES[type]}`),
  ].join("\n");
}
