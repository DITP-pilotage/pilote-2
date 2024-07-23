import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';

export default interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  typeDeRéforme: TypeDeRéforme,
  chantierEstTerritorialisé: boolean,
  dateDeMiseAJourIndicateur: string
}
