import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import Indicateur from '@/server/chantiers/domain/Indicateur';

export default interface IndicateurÉvolutionProps {
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  dateDeMiseAJourIndicateur: string | null
  source: Indicateur['source']
}
