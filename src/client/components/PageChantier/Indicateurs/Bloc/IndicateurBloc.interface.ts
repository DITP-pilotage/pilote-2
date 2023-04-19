import { DétailsIndicateur } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateur: Record<CodeInsee, DétailsIndicateur>
  estDisponibleALImport: boolean
}
