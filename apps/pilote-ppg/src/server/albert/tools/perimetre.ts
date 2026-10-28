import { z } from "zod";
import type { Perimetre } from "@/server/albert/domain/Perimetre";

/**
 * Une variante de périmètre par type. Chaque outil compose sa
 * `z.discriminatedUnion("type", [...])` avec les seules variantes qu'il
 * accepte : le LLM ne voit jamais une variante qu'il n'a pas le droit
 * d'utiliser.
 */
export const variantesPerimetre = {
  SELECTION: z
    .object({
      type: z.literal("SELECTION"),
      territoire_codes: z
        .array(z.string())
        .min(1)
        .describe(
          "Codes des territoires (ex: ['DEPT-59', 'REG-53', 'NAT-FR'])",
        ),
    })
    .describe("Des territoires précis, désignés par leurs codes."),
  REGION_ET_SES_DEPARTEMENTS: z
    .object({
      type: z.literal("REGION_ET_SES_DEPARTEMENTS"),
      region_code: z
        .string()
        .regex(/^REG-/)
        .describe("Code de la région (ex: REG-53)"),
    })
    .describe(
      "Une région et tous ses départements, résolus par l'outil (« la Bretagne et ses départements », « les départements bretons »).",
    ),
  FRANCE_ET_SES_REGIONS: z
    .object({ type: z.literal("FRANCE_ET_SES_REGIONS") })
    .describe("La France (NAT-FR) et toutes ses régions."),
  TOUTES_REGIONS: z
    .object({ type: z.literal("TOUTES_REGIONS") })
    .describe("Toutes les régions, sans la France."),
  TOUS_DEPARTEMENTS: z
    .object({ type: z.literal("TOUS_DEPARTEMENTS") })
    .describe("Tous les départements."),
} satisfies {
  [Type in Perimetre["type"]]: z.ZodType<Extract<Perimetre, { type: Type }>>;
};

export const DESCRIPTION_PERIMETRE =
  "Les territoires visés, en un seul appel : jamais un appel par territoire.";

/**
 * Transitoire : traduit l'ancien couple `territoire_code` /
 * `include_sous_territoires` le temps que tous les outils prennent un
 * `perimetre`.
 */
export function perimetreDepuisTerritoire({
  territoireCode,
  includeSousTerritoires,
}: {
  territoireCode: string;
  includeSousTerritoires: boolean;
}): Perimetre {
  if (!includeSousTerritoires || territoireCode.startsWith("DEPT-")) {
    return { type: "SELECTION", territoire_codes: [territoireCode] };
  }
  if (territoireCode === "NAT-FR") return { type: "FRANCE_ET_SES_REGIONS" };
  return { type: "REGION_ET_SES_DEPARTEMENTS", region_code: territoireCode };
}
