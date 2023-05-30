import { z } from 'zod';
import { météosSaisissables } from '@/server/domain/météo/Météo.interface';

export const LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS = 5000;

export const validationSynthèseDesRésultatsContexte = z.object({
  réformeId: z.string(),
  territoireCode: z.string(),
});

export const validationSynthèseDesRésultatsFormulaire = z.object({
  contenu: z
    .string()
    .max(LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS, `La limite maximale de ${LIMITE_CARACTÈRES_SYNTHÈSE_DES_RÉSULTATS} caractères a été dépassée`)
    .min(1, 'Le commentaire ne peut pas être vide'),
  météo: z.enum(météosSaisissables),
});
