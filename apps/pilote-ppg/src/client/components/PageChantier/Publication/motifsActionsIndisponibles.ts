import { z } from "zod";

export interface MotifsActionsIndisponibles {
  publier: string[];
  brouillon: string[];
}

export const motifsBloquants = (schema: z.ZodType, values: unknown) => {
  const result = schema.safeParse(values);
  return result.success
    ? []
    : [...new Set(result.error.issues.map((issue) => issue.message))];
};

export const motifsActionsIndisponibles = (
  values: unknown,
  {
    draftSchema,
    publishSchema,
  }: { draftSchema: z.ZodType; publishSchema: z.ZodType },
): MotifsActionsIndisponibles => ({
  publier: motifsBloquants(publishSchema, values),
  brouillon: motifsBloquants(draftSchema, values),
});
