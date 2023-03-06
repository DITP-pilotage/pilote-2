import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDétailsParTerritoire } from '../IndicateurBloc.interface';

export default interface IndicateurDétailsProps {
  indicateurId: Indicateur['id']
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
}
