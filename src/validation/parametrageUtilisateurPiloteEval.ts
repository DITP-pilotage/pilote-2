import { z } from "zod";

export const parametrageUtilisateurPiloteEvalSchema = z.object({
  autoEvaluation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  consolidation: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  instructionObjectifs: z.object({
    rattachementCodes: z.array(z.string()),
  }),
  instructionManiereDeServir: z.object({
    critereCodes: z.array(z.string()),
  }),
});

export type ParametrageUtilisateurPiloteEvalFormulaire = z.infer<
  typeof parametrageUtilisateurPiloteEvalSchema
>;
