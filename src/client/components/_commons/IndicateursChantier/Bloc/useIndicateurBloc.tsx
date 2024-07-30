import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

export default function useIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireSélectionné: DétailTerritoire | null) {
  const dateDeMiseAJourIndicateur = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.dateImport, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateMaj = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.prochaineDateMaj, 'DD/MM/YYYY') ?? null
    : null;

  const dateProchaineDateValeurActuelle = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.prochaineDateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  const dateValeurActuelle = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.dateValeurActuelle, 'DD/MM/YYYY') ?? null
    : null;

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
    dateProchaineDateValeurActuelle,
    dateValeurActuelle,
  };
}
