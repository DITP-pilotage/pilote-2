import { z } from "zod";
import {
  VUES_ASSISTANT,
  type VueAssistant,
} from "@/components/_commons/ChatUI/affichageAssistant";

const CLE = "albert:vue";

const vueSchema = z.enum(VUES_ASSISTANT);

// La vue qui convient dépend de l'écran : la préférence reste propre à
// l'appareil, dans le localStorage.
export const readPreferenceVue = (): VueAssistant | null => {
  try {
    const result = vueSchema.safeParse(localStorage.getItem(CLE));
    return result.success ? result.data : null;
  } catch {
    // Stockage indisponible (navigation privée, données bloquées).
    return null;
  }
};

export const writePreferenceVue = (vue: VueAssistant): void => {
  try {
    localStorage.setItem(CLE, vue);
  } catch {
    // Stockage indisponible : la préférence n'est simplement pas retenue.
  }
};
