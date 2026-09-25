import { type $Enums } from "@prisma/client";

export type ManqueParametrage = "VALEUR_INITIALE" | "VALEUR_CIBLE";

export interface IndicateurNonAJour {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  nom: string;
  periodicite: string | null;
  delaiDisponibilite: number | null;
  mailles: $Enums.Maille[];
  nbTerritoiresEnRetard: number;
  nbTerritoiresApplicables: number;
  retardMaxJours: number | null;
  dateDerniereValeurPlusAncienne: string | null;
  dateMajAttenduePlusAncienne: string | null;
  responsablesDonneesMails: string[];
}

export interface IndicateurAParametrer {
  chantierId: string;
  chantierNom: string;
  indicateurId: string;
  nom: string;
  periodicite: string | null;
  manques: ManqueParametrage[];
  nbTerritoires: number;
  nbTerritoiresApplicables: number;
}

export interface IndicateursAMettreAJour {
  nonAJour: IndicateurNonAJour[];
  aParametrer: IndicateurAParametrer[];
}

export interface TerritoireNonAJour {
  code: string;
  nom: string;
  maille: $Enums.Maille;
  dateDerniereValeur: string | null;
  dateMajAttendue: string | null;
  retardJours: number | null;
}
