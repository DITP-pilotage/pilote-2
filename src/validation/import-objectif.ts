import { z } from "zod";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";

export const typesObjectifAPIVersDomaine = {
  notre_ambition: "notreAmbition",
  deja_fait: "dejaFait",
  a_faire: "aFaire",
} as const;

export type TypeObjectifAPI = keyof typeof typesObjectifAPIVersDomaine;

const tousLesTypesObjectifAPI = Object.keys(typesObjectifAPIVersDomaine) as [
  TypeObjectifAPI,
  ...TypeObjectifAPI[],
];

export function mapTypeObjectifAPIVersDomaine(
  typeAPI: TypeObjectifAPI,
): TypeObjectif {
  return typesObjectifAPIVersDomaine[typeAPI];
}

export const importObjectifSchema = z.object({
  type: z.enum(tousLesTypesObjectifAPI, {
    errorMap: () => ({
      message: `Le type d'objectif doit être l'un des suivants : ${tousLesTypesObjectifAPI.join(", ")}`,
    }),
  }),
  contenu: z
    .string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(10000, "Le contenu ne peut pas dépasser 10000 caractères"),
  date_objectif: z
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
        message: "La date de l'objectif ne peut pas être dans le futur",
      },
    )
    .optional(),
});

export const importObjectifsSchema = z.object({
  objectifs: z
    .array(importObjectifSchema)
    .min(1, "Au moins un objectif est requis"),
});

export type ImportObjectifInput = z.infer<typeof importObjectifSchema>;
