import { CartographieÉlémentDeLégende } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";
import type { EtatMiseAJour } from "@/server/chantiers/infrastructure/queries/indicateurNonAJour";

export const LEGEND_ITEMS_NON_A_JOUR_CHANTIER: Record<
  EtatMiseAJour,
  CartographieÉlémentDeLégende
> = {
  A_JOUR: {
    libellé: "Tous les indicateurs sont à jour",
    remplissage: "#27A658",
  },
  NON_A_JOUR: {
    libellé: "Un ou plusieurs indicateurs ne sont pas à jour",
    remplissage: "#B34000",
  },
  SANS_DONNEE: {
    libellé: "Un ou plusieurs indicateurs sans donnée",
    remplissage: "#bababa",
  },
  NON_APPLICABLE: {
    libellé: "Territoire où le chantier prioritaire ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};

export const LEGEND_ITEMS_NON_A_JOUR_INDICATEUR: Record<
  EtatMiseAJour,
  CartographieÉlémentDeLégende
> = {
  A_JOUR: {
    libellé: "L'indicateur est à jour",
    remplissage: "#27A658",
  },
  NON_A_JOUR: {
    libellé: "Donnée existante, mais non à jour",
    remplissage: "#B34000",
  },
  SANS_DONNEE: {
    libellé: "Données requises mais non renseignées",
    remplissage: "#bababa",
  },
  NON_APPLICABLE: {
    libellé: "Territoire où l'indicateur ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};
