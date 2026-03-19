import { z } from "zod";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";

export const LIMITE_CARACTERES_OBJECTIF = 5000;

export const validationObjectifContexte = z.object({
  chantierId: z.string(),
  type: z.enum(typesObjectif),
});

export const validationObjectifFormulaire = z.object({
  contenu: z
    .string()
    .max(
      LIMITE_CARACTERES_OBJECTIF,
      `La limite de ${LIMITE_CARACTERES_OBJECTIF} caractères a été dépassée`,
    )
    .min(1, "L'objectif ne peut pas être vide"),
});

export const validationBrouillonObjectifAPublier = z.object({
  brouillonId: z.string(),
});

export const validationObjectifAModifier = z.object({
  objectifId: z.string(),
});
