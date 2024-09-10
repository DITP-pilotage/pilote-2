import { actionsTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';

export default function useSousIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireCode: string) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const detailTerritoireSelectionne = récupérerDétailsSurUnTerritoire(territoireCode);

  const dateDeMiseAJourIndicateur = detailTerritoireSelectionne
    ? formaterDate(détailsIndicateur[detailTerritoireSelectionne.codeInsee]?.dateImport, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateMaj = detailTerritoireSelectionne
    ? formaterDate(détailsIndicateur[detailTerritoireSelectionne.codeInsee]?.prochaineDateMaj, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateValeurActuelle = detailTerritoireSelectionne
    ? formaterDate(détailsIndicateur[detailTerritoireSelectionne.codeInsee]?.prochaineDateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  const dateValeurActuelle = detailTerritoireSelectionne
    ? formaterDate(détailsIndicateur[detailTerritoireSelectionne.codeInsee]?.dateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  const indicateurNonAJour = detailTerritoireSelectionne
    ? détailsIndicateur[detailTerritoireSelectionne.codeInsee]?.estAJour === false
    : false;

  const indicateurEstApplicable = !!détailsIndicateur[detailTerritoireSelectionne.codeInsee].est_applicable;

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
    indicateurNonAJour,
    indicateurEstApplicable,
  };
}
