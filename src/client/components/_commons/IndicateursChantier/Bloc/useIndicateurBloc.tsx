import { DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { formaterDate } from '@/client/utils/date/date';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

export default function useIndicateurBloc(détailsIndicateur: DétailsIndicateurTerritoire, territoireSélectionné: DétailTerritoire | null) {
  const dateDeMiseAJourIndicateur = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.dateImport, 'DD/MM/YYYY') ?? 'Non renseigné'
    : 'Non renseigné';

  const dateProchaineDateMaj = territoireSélectionné
    ? formaterDate(détailsIndicateur[territoireSélectionné.codeInsee]?.prochaineDateMaj, 'DD/MM/YYYY') ?? 'Non renseigné'
    : 'Non renseigné';

  return {
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  };
}
