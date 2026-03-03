import { z } from "zod";
import {
  météos,
  météosSaisissables,
} from "@/server/domain/météo/Météo.interface";

export const LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS = 1000;
export const LIMITE_CARACTÈRES_AFFICHAGE_SYNTHÈSE_DES_RÉSULTATS = 250;

export const validationSynthèseDesRésultatsContexte = z.object({
  typeDeRéforme: z.string(),
  réformeId: z.string(),
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
  meteo: z.enum(météosSaisissables),
});

export const validationSyntheseAModifier = z.object({
  syntheseAModifier: z.object({
    id: z.string(),
    chantierId: z.string(),
    territoireCode: z.string(),
    contenu: z.string(),
    météo: z.enum(météos),
    auteur_creation_id: z.string(),
    date_creation: z.string(),
    auteur_modification_id: z.string(),
    date_modification: z.string(),
  }),
});
