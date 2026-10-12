import {
  LEGEND_ITEMS_NON_A_JOUR_CHANTIER,
  LEGEND_ITEMS_NON_A_JOUR_INDICATEUR,
} from "@/client/constants/légendes/legendItemsIndicateursNonAJour";
import { formaterDate } from "@/client/utils/date/date";
import type {
  TerritoireNonAJourChantierViewModel,
  TerritoireNonAJourIndicateurViewModel,
} from "@/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery";

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

export const isTerritoireNonAJour = (territoire: TerritoireNonAJour) => {
  if (!territoire.estApplicable) return false;
  return isChantierMode(territoire)
    ? territoire.nbIndicateursNonAJour > 0
    : !territoire.estAJour;
};

export const getFill = (territoire: TerritoireNonAJour, mode: NonAJourMode) => {
  const legendItems = getLegendItems(mode);
  if (!territoire.estApplicable) return legendItems.NON_APPLICABLE.remplissage;
  return isTerritoireNonAJour(territoire)
    ? legendItems.NON_A_JOUR.remplissage
    : legendItems.A_JOUR.remplissage;
};

export const buildLegend = (
  territoires: TerritoireNonAJour[],
  mode: NonAJourMode,
) => {
  const allApplicable = territoires.every(
    (territoire) => territoire.estApplicable,
  );
  return Object.entries(getLegendItems(mode))
    .filter(([key]) => !(allApplicable && key === "NON_APPLICABLE"))
    .map(([, { remplissage, libellé }]) => ({ libellé, remplissage }));
};

export const formatNbIndicateursNonAJour = (
  territoire: TerritoireNonAJourChantierViewModel,
): string => {
  if (!territoire.estApplicable) return "Non applicable";
  if (territoire.nbIndicateursNonAJour === 0) return "À jour";
  return `${territoire.nbIndicateursNonAJour} ${
    territoire.nbIndicateursNonAJour > 1 ? "indicateurs" : "indicateur"
  } non à jour`;
};

export const formatEtatIndicateur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string => {
  if (!territoire.estApplicable) return "Non applicable";
  return territoire.estAJour ? "À jour" : "Non à jour";
};

// Une date ISO sans heure est lue en UTC par `new Date` : on force minuit local
// pour ne pas afficher la veille dans les fuseaux négatifs (Antilles, Guyane…).
const formatIsoDate = (isoDate: string | null) =>
  formaterDate(isoDate ? `${isoDate}T00:00:00` : null, "DD/MM/YYYY");

export const formatDateDerniereValeur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string => formatIsoDate(territoire.dateDerniereValeur) ?? "Aucune valeur";

export const formatMiseAJourAttendueDepuis = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string => formatIsoDate(territoire.miseAJourAttendueDepuis) ?? "-";
