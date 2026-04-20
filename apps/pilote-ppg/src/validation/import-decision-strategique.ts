import { z } from "zod";
import { TypeDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";

export const typesDecisionStrategiqueAPIVersDomaine = {
  suivi_des_decisions: "suiviDesDecisionsStrategiques",
} as const;

export type TypeDecisionStrategiqueAPI =
  keyof typeof typesDecisionStrategiqueAPIVersDomaine;

const tousLesTypesDecisionStrategiqueAPI = Object.keys(
  typesDecisionStrategiqueAPIVersDomaine,
) as [TypeDecisionStrategiqueAPI, ...TypeDecisionStrategiqueAPI[]];

export function mapTypeDecisionStrategiqueAPIVersDomaine(
  typeAPI: TypeDecisionStrategiqueAPI,
): TypeDecisionStrategique {
  return typesDecisionStrategiqueAPIVersDomaine[typeAPI];
}

export const importDecisionStrategiqueSchema = z.object({
  type: z.enum(tousLesTypesDecisionStrategiqueAPI, {
    errorMap: () => ({
      message: `Le type de décision stratégique doit être l'un des suivants : ${tousLesTypesDecisionStrategiqueAPI.join(", ")}`,
    }),
  }),
  contenu: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(10000, "Le contenu ne peut pas dépasser 10000 caractères"),
  date_decision_strategique: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Le format de la date doit être YYYY-MM-DD")
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      {
        message:
          "La date de la décision stratégique ne peut pas être dans le futur",
      },
    )
    .optional(),
});

export const importDecisionsStrategiquesSchema = z.object({
  decisions_strategiques: z
    .array(importDecisionStrategiqueSchema)
    .min(1, "Au moins une décision stratégique est requise"),
});

export type ImportDecisionStrategiqueInput = z.infer<
  typeof importDecisionStrategiqueSchema
>;
