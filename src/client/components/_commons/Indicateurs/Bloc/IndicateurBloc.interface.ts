import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { DétailsIndicateur, DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  territoireProjetStructurant?: ProjetStructurant['territoire']
  estDisponibleALImport: boolean
  estInteractif: boolean
  typeDeRéforme: TypeDeRéforme
  chantierEstTerritorialisé: boolean
  listeSousIndicateurs: Indicateur[]
  estAutoriseAVoirLesAlertesMAJIndicateurs: boolean,
}
