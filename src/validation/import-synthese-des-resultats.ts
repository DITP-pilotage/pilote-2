import { z } from "zod";
import { météosSaisissables } from "@/server/domain/météo/Météo.interface";

export const importSyntheseDesResultatsSchema = z.object({
  territoire: z
    .string()
    .regex(
      /^(NAT|REG|DEPT)-[A-Z0-9]+$/,
      "Le format du territoire doit être NAT-XX, REG-XX ou DEPT-XX",
    ),
  contenu: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(10000, "Le contenu ne peut pas dépasser 10000 caractères"),
  meteo: z.enum(météosSaisissables, {
    errorMap: () => ({
      message: `La météo doit être l'une des suivantes : ${météosSaisissables.join(", ")}`,
    }),
  }),
  date_synthese: z
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
          "La date de la synthèse des résultats ne peut pas être dans le futur",
      },
    )
    .optional(),
});

export const importSynthesesDesResultatsSchema = z.object({
  syntheses_des_resultats: z
    .array(importSyntheseDesResultatsSchema)
    .min(1, "Au moins une synthèse des résultats est requise"),
});

export type ImportSyntheseDesResultatsInput = z.infer<
  typeof importSyntheseDesResultatsSchema
>;
