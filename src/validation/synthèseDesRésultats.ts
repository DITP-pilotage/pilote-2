import { z } from "zod";
import { meteosSaisissables } from "@/server/domain/météo/Météo.interface";

export const LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS = 1000;

export const validationSynthèseDesRésultatsContexte = z.object({
  chantierId: z.string(),
  territoireCode: z.string(),
});

export const validationSynthèseDesRésultatsFormulaire = z.object({
  contenu: z
    .string()
    .max(
      LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS,
      `La limite maximale de ${LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS} caractères a été dépassée`,
    )
    .min(1, "Le commentaire ne peut pas être vide"),
  meteo: z.enum(meteosSaisissables),
});

export const validationBrouillonAPublier = z.object({
  brouillonId: z.string(),
});

export const validationSyntheseAModifier = z.object({
  syntheseId: z.string(),
});
