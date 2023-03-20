import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDétailsParTerritoire } from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBloc.interface';

export default interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
}
