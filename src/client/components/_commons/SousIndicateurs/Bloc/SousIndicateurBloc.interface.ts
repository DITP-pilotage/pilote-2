import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';


export default interface SousIndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  estDisponibleALImport: boolean
  estInteractif: boolean
  chantierEstTerritorialisé: boolean
  classeCouleurFond: string
  territoireCode: string
  mailleSelectionnee: MailleInterne
}
