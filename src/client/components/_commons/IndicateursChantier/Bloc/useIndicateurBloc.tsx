import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';

export default function useIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireCode: string) {
  const { codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);
  const dateDeMiseAJourIndicateur = formaterDate(détailsIndicateur[codeInsee]?.dateImport, 'DD/MM/YYYY') ?? null;

  const dateProchaineDateMaj = formaterDate(détailsIndicateur[codeInsee]?.prochaineDateMaj, 'MM/YYYY') ?? null;

  const dateProchaineDateValeurActuelle = formaterDate(détailsIndicateur[codeInsee]?.prochaineDateValeurActuelle, 'MM/YYYY') ?? null;

  const dateValeurActuelle = formaterDate(détailsIndicateur[codeInsee]?.dateValeurActuelle, 'MM/YYYY') ?? null;

  const indicateurNonAJour = !détailsIndicateur[codeInsee]?.estAJour;

  const indicateurEstApplicable = !!détailsIndicateur[codeInsee]?.est_applicable;

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
    indicateurNonAJour,
    indicateurEstApplicable,
  };
}
