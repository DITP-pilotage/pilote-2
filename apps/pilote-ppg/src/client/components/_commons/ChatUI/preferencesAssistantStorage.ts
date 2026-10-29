import { z } from "zod";
import {
  VUES_ASSISTANT,
  type TailleFenetre,
  type VueAssistant,
} from "@/components/_commons/ChatUI/affichageAssistant";

// La vue et la largeur qui conviennent dépendent de l'écran : ces
// préférences restent propres à l'appareil, dans le localStorage.
const CLE_VUE = "albert:vue";
const CLE_LARGEUR_PANNEAU = "albert:largeurPanneau";
const CLE_TAILLE_FENETRE = "albert:tailleFenetre";

const vueSchema = z.enum(VUES_ASSISTANT);
const largeurSchema = z.coerce.number().int().positive();
const tailleFenetreSchema = z.object({
  largeur: z.number().int().positive(),
  hauteur: z.number().int().positive(),
});

const lire = (cle: string): string | null => {
  try {
    return localStorage.getItem(cle);
  } catch {
    // Stockage indisponible (navigation privée, données bloquées).
    return null;
  }
};

const ecrire = (cle: string, valeur: string): void => {
  try {
    localStorage.setItem(cle, valeur);
  } catch {
    // Stockage indisponible : la préférence n'est simplement pas retenue.
  }
};

export const readPreferenceVue = (): VueAssistant | null => {
  const result = vueSchema.safeParse(lire(CLE_VUE));
  return result.success ? result.data : null;
};

export const writePreferenceVue = (vue: VueAssistant): void =>
  ecrire(CLE_VUE, vue);

export const readLargeurPanneau = (): number | null => {
  const brut = lire(CLE_LARGEUR_PANNEAU);
  if (brut === null) return null;
  const result = largeurSchema.safeParse(brut);
  return result.success ? result.data : null;
};

export const writeLargeurPanneau = (largeur: number): void =>
  ecrire(CLE_LARGEUR_PANNEAU, String(largeur));

export const readTailleFenetre = (): TailleFenetre | null => {
  const brut = lire(CLE_TAILLE_FENETRE);
  if (brut === null) return null;
  try {
    const result = tailleFenetreSchema.safeParse(JSON.parse(brut));
    return result.success ? result.data : null;
  } catch {
    // Contenu illisible : comme si rien n'avait été retenu.
    return null;
  }
};

export const writeTailleFenetre = (taille: TailleFenetre): void =>
  ecrire(CLE_TAILLE_FENETRE, JSON.stringify(taille));
