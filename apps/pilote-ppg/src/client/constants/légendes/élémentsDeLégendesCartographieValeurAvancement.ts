import { CartographieÉlémentsDeLégende } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";

const REMPLISSAGE_PAR_DÉFAUT = "#bababa";

export const ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE: CartographieÉlémentsDeLégende = {
  DÉFAUT: {
    libellé: "Territoire pour lequel la donnée n'est pas renseignée/disponible",
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
  NON_APPLICABLE: {
    libellé: "Territoire où le chantier prioritaire ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};
