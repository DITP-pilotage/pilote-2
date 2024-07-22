import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';

export default interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  typeDeRéforme: TypeDeRéforme
  chantierEstTerritorialisé: boolean
  dateDeMiseAJourIndicateur: string
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  estSousIndicateur?: boolean
}
