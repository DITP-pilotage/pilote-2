import { CartographieÉlémentsDeLégende } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";

export const ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS: CartographieÉlémentsDeLégende =
  {
    DEFAUT: {
      libellé: "Aucun indicateur ne fait l'objet d'une proposition",
      remplissage: "#bababa",
    },
    PROPOSITION: {
      libellé: "Un ou plusieurs indicateurs font l'objet d'une proposition",
      remplissage: "#C3992A",
    },
    NON_APPLICABLE: {
      libellé: "Territoire où le chantier prioritaire ne s'applique pas",
      remplissage: REMPLISSAGE_HACHURE,
    },
  };

export const ELEMENTS_LEGENDE_PROPOSITION_VALEUR_INDICATEURS: CartographieÉlémentsDeLégende =
  {
    DEFAUT: {
      libellé: "L'indicateur ne fait pas l'objet d'une proposition",
      remplissage: "#bababa",
    },
    PROPOSITION: {
      libellé: "L'indicateur fait l'objet d'une proposition",
      remplissage: "#C3992A",
    },
    NON_APPLICABLE: {
      libellé: "Territoire où le chantier prioritaire ne s'applique pas",
      remplissage: REMPLISSAGE_HACHURE,
    },
  };
