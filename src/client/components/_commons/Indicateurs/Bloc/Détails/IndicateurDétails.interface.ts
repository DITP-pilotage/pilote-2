import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import { TypeDeRéforme } from '@/components/PageAccueil/SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';

export default interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  typeDeRéforme: TypeDeRéforme
}
