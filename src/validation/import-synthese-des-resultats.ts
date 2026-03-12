import { z } from "zod";
import { MeteoSaisissable } from "@/server/domain/météo/Météo.interface";

export const météosOpenAPI = [
  "OBJECTIF_COMPROMIS",
  "APPUIS_NECESSAIRE",
  "OBJECTIF_ATTEIGNABLE",
  "OBJECTIF_SECURISE",
] as const;

export type MétéoOpenAPI = (typeof météosOpenAPI)[number];

export const méteoOpenAPIVersInterne: Record<MétéoOpenAPI, MeteoSaisissable> = {
  OBJECTIF_COMPROMIS: "ORAGE",
  APPUIS_NECESSAIRE: "NUAGE",
  OBJECTIF_ATTEIGNABLE: "COUVERT",
  OBJECTIF_SECURISE: "SOLEIL",
};

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
  meteo: z
    .enum(météosOpenAPI, {
      errorMap: () => ({
        message: `La météo doit être l'une des suivantes : ${météosOpenAPI.join(", ")}`,
      }),
    })
    .transform((valeur) => méteoOpenAPIVersInterne[valeur]),
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

export type ImportSyntheseDesResultatsOpenAPIInput = z.input<
  typeof importSyntheseDesResultatsSchema
>;
