import { ReactNode } from "react";
import { CouleurHexa } from "@/client/utils/couleur/couleur.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";

export type Remplissage = CouleurHexa | typeof REMPLISSAGE_HACHURE;

export type CartographieÉlémentDeLégende = {
  libellé: string;
  picto?: ReactNode;
  remplissage: Remplissage;
};

export type CartographieÉlémentsDeLégende = Record<
  string,
  CartographieÉlémentDeLégende
>;
