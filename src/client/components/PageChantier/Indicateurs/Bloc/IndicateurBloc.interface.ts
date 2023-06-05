import { DétailsIndicateur, DétailsIndicateurCodeInsee } from '@/server/domain/chantier/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateur: DétailsIndicateurCodeInsee
  estDisponibleALImport: boolean
  estInteractif: boolean
}
