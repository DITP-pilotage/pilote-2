import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurÉvolutionProps {
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  dateDeMiseAJourIndicateur: string | null
  source: Indicateur['source']
}
