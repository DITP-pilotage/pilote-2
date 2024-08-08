import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { DétailsIndicateur, DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export type IndicateurDétailsParTerritoire = {
  territoireNom: string
  données: DétailsIndicateur
};
export default interface IndicateurBlocProps {
  indicateur: Indicateur
  détailsIndicateurs: DétailsIndicateurs
  territoireProjetStructurant?: ProjetStructurant['territoire']
  territoireCode: string
  estInteractif: boolean
  mailleSelectionnee: MailleInterne
  typeDeRéforme: TypeDeRéforme
  chantierEstTerritorialisé: boolean
  listeSousIndicateurs: Indicateur[]
}
