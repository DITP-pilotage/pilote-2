import { DétailsIndicateur, DétailsIndicateurTerritoire } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateur: DétailsIndicateurTerritoire
  estDisponibleALImport: boolean
  estInteractif: boolean
}
