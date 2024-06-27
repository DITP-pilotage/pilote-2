import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';


export default interface SousIndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  estDisponibleALImport: boolean
  estInteractif: boolean
  chantierEstTerritorialisé: boolean
  estAutoriseAVoirLesAlertesMAJIndicateurs: boolean
  classeCouleurFond: string 
}
