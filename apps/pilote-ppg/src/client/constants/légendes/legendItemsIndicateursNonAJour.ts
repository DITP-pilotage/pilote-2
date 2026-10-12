import { CartographieÉlémentsDeLégende } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";

export const LEGEND_ITEMS_NON_A_JOUR_CHANTIER: CartographieÉlémentsDeLégende = {
  NON_A_JOUR: {
    libellé: "Un ou plusieurs indicateurs ne sont pas à jour",
    remplissage: "#B34000",
  },
  A_JOUR: {
    libellé: "Tous les indicateurs sont à jour",
    remplissage: "#bababa",
  },
  NON_APPLICABLE: {
    libellé: "Territoire où le chantier prioritaire ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};

export const LEGEND_ITEMS_NON_A_JOUR_INDICATEUR: CartographieÉlémentsDeLégende =
  {
    NON_A_JOUR: {
      libellé: "L'indicateur n'est pas à jour",
      remplissage: "#B34000",
    },
    A_JOUR: {
      libellé: "L'indicateur est à jour",
      remplissage: "#bababa",
    },
    NON_APPLICABLE: {
      libellé: "Territoire où l'indicateur ne s'applique pas",
      remplissage: REMPLISSAGE_HACHURE,
    },
  };
