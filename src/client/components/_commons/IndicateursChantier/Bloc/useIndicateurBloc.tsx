import { formaterDate } from "@/client/utils/date/date";
import { DetailsIndicateursTerritoireContrat } from "@/server/chantiers/app/contrats/DetailsIndicateursTerritoireContrat";

export const useIndicateurBloc = (
  détailsIndicateur: DetailsIndicateursTerritoireContrat,
  territoireCode: string,
) => {
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

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurAvancement,
    dateValeurAvancement,
  };
};
