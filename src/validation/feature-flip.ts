import { z } from "zod";
import { FEATURE_FLIP_KEYS } from "@/server/gestion-contenu/domain/VariableContenuDisponible";

const featureFlipEntries = FEATURE_FLIP_KEYS.map(
  (key) => [key, z.boolean().optional()] as const,
);

export const validationFeatureFlip = z.object({
  featureFlips: z
    .object(
      Object.fromEntries(featureFlipEntries) as {
        [K in (typeof FEATURE_FLIP_KEYS)[number]]: z.ZodOptional<z.ZodBoolean>;
      },
    )
    .partial(),
});
