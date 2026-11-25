import {
  LEGEND_ITEMS_NON_A_JOUR_CHANTIER,
  LEGEND_ITEMS_NON_A_JOUR_INDICATEUR,
} from "@/client/constants/légendes/legendItemsIndicateursNonAJour";
import type {
  TerritoireNonAJourChantierViewModel,
  TerritoireNonAJourIndicateurViewModel,
} from "@/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery";
import type { EtatMiseAJour } from "@/server/chantiers/infrastructure/queries/indicateurNonAJour";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

export type NonAJourMode = "chantier" | "indicateur";

export type TerritoireNonAJour =
  TerritoireNonAJourChantierViewModel | TerritoireNonAJourIndicateurViewModel;

export const isChantierMode = (
  territoire: TerritoireNonAJour,
): territoire is TerritoireNonAJourChantierViewModel =>
  "nbIndicateursNonAJour" in territoire;

const getLegendItems = (mode: NonAJourMode) =>
  mode === "indicateur"
    ? LEGEND_ITEMS_NON_A_JOUR_INDICATEUR
    : LEGEND_ITEMS_NON_A_JOUR_CHANTIER;

export const getFill = (territoire: TerritoireNonAJour, mode: NonAJourMode) =>
  getLegendItems(mode)[territoire.etat].remplissage;

export const buildLegend = (
  territoires: TerritoireNonAJour[],
  mode: NonAJourMode,
) => {
  const allApplicable = territoires.every(
    (territoire) => territoire.etat !== "NON_APPLICABLE",
  );
  return Object.entries(getLegendItems(mode))
    .filter(([etat]) => !(allApplicable && etat === "NON_APPLICABLE"))
    .map(([, { remplissage, libellé }]) => ({ libellé, remplissage }));
};

const RANG_ETAT: Record<EtatMiseAJour, number> = {
  NON_A_JOUR: 0,
  SANS_DONNEE: 1,
  A_JOUR: 2,
  NON_APPLICABLE: 3,
};

export const compareTerritoires = (
  left: TerritoireNonAJour,
  right: TerritoireNonAJour,
): number => {
  const ecartEtat = RANG_ETAT[left.etat] - RANG_ETAT[right.etat];
  if (ecartEtat !== 0 || !isChantierMode(left) || !isChantierMode(right)) {
    return ecartEtat;
  }
  return (
    right.nbIndicateursNonAJour - left.nbIndicateursNonAJour ||
    right.nbIndicateursSansDonnee - left.nbIndicateursSansDonnee
  );
};

const pluriel = (nombre: number, mot: string) =>
  `${nombre} ${mot}${nombre > 1 ? "s" : ""}`;

export const formatEtatChantier = (
  territoire: TerritoireNonAJourChantierViewModel,
): string => {
  if (territoire.etat === "NON_APPLICABLE") return "Non applicable";
  if (territoire.etat === "A_JOUR") return "À jour";

  const { nbIndicateursNonAJour, nbIndicateursSansDonnee } = territoire;
  if (nbIndicateursNonAJour === 0) {
    return `${pluriel(nbIndicateursSansDonnee, "indicateur")} sans donnée`;
  }
  const nonAJour = `${pluriel(nbIndicateursNonAJour, "indicateur")} non à jour`;
  return nbIndicateursSansDonnee === 0
    ? nonAJour
    : `${nonAJour} · ${nbIndicateursSansDonnee} sans donnée`;
};

const LIBELLES_ETAT_INDICATEUR: Record<EtatMiseAJour, string> = {
  A_JOUR: "À jour",
  NON_A_JOUR: "Non à jour",
  SANS_DONNEE: "Données requises mais non renseignées",
  NON_APPLICABLE: "Non applicable",
};

export const formatEtatIndicateur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string => LIBELLES_ETAT_INDICATEUR[territoire.etat];

export const formatDateDerniereValeur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string =>
  territoire.dateDerniereValeur
    ? PiloteDateFormatter.isoDateFranceMetropolitaine(
        territoire.dateDerniereValeur,
      )
    : "Aucune valeur";

export const formatMiseAJourAttendueDepuis = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string =>
  territoire.miseAJourAttendueDepuis
    ? PiloteDateFormatter.isoDateFranceMetropolitaine(
        territoire.miseAJourAttendueDepuis,
      )
    : "-";
