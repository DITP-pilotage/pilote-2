import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { IndicateurDétailsParTerritoire } from '@/components/_commons/IndicateursNew/Bloc/IndicateurBloc.interface';

export default interface IndicateurDétailsParTerritoireProps {
  indicateurDétailsParTerritoire: IndicateurDétailsParTerritoire
  typeDeRéforme: TypeDeRéforme
  unité?: string | null
}
