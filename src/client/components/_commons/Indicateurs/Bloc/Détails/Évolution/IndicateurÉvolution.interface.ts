import { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurÉvolutionProps {
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  dateDeMiseAJourIndicateur: string
  source: Indicateur['source']
}
