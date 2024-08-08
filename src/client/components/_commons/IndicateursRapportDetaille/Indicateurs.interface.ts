import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default interface RubriquesIndicateursProps {
  chantierEstTerritorialisé: boolean;
  détailsIndicateurs: DétailsIndicateurs
  estInteractif?: boolean
  indicateurs: Indicateur[],
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[],
  mailleSelectionnee: MailleInterne
  territoireCode?: string
  territoireProjetStructurant?: ProjetStructurant['territoire']
  typeDeRéforme: TypeDeRéforme
}
