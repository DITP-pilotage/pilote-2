import { DétailsIndicateurTerritoire } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { formaterDate } from "@/client/utils/date/date";

export default function useIndicateurBloc(
  détailsIndicateur: DétailsIndicateurTerritoire,
  territoireCode: string,
) {
  const dateDeMiseAJourIndicateur =
    formaterDate(détailsIndicateur[territoireCode]?.dateImport, "DD/MM/YYYY") ??
    null;

  const dateProchaineDateMaj =
    formaterDate(
      détailsIndicateur[territoireCode]?.prochaineDateMaj,
      "MM/YYYY",
    ) ?? null;

  const dateProchaineDateValeurAvancement =
    formaterDate(
      détailsIndicateur[territoireCode]?.prochaineDateValeurAvancement,
      "MM/YYYY",
    ) ?? null;

  const dateValeurAvancement =
    formaterDate(
      détailsIndicateur[territoireCode]?.dateValeurAvancement,
      "MM/YYYY",
    ) ?? null;

  const indicateurNonAJour = !détailsIndicateur[territoireCode]?.estAJour;

  const indicateurEstApplicable =
    !!détailsIndicateur[territoireCode]?.est_applicable;

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurAvancement,
    dateValeurAvancement,
    indicateurNonAJour,
    indicateurEstApplicable,
  };
}
