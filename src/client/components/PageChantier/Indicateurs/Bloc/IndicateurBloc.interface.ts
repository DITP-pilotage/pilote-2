import { DetailsIndicateur } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DetailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateur: Record<CodeInsee, DetailsIndicateur>
}
