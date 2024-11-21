import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';

export default function useSousIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireCode: string) {
  const dateDeMiseAJourIndicateur = formaterDate(détailsIndicateur[territoireCode]?.dateImport, 'DD/MM/YYYY') ?? null;

  const dateProchaineDateMaj = formaterDate(détailsIndicateur[territoireCode]?.prochaineDateMaj, 'DD/MM/YYYY') ?? null;

  const dateProchaineDateValeurActuelle = formaterDate(détailsIndicateur[territoireCode]?.prochaineDateValeurActuelle, 'DD/MM/YYYY') ?? null;

  const dateValeurActuelle = formaterDate(détailsIndicateur[territoireCode]?.dateValeurActuelle, 'DD/MM/YYYY') ?? null;

  const indicateurNonAJour = détailsIndicateur[territoireCode]?.estAJour === false;

  const indicateurEstApplicable = !!détailsIndicateur[territoireCode].est_applicable;

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
    indicateurNonAJour,
    indicateurEstApplicable,
  };
}
