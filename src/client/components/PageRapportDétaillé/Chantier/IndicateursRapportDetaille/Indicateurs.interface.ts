import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';
import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface RubriquesIndicateursProps {
  détailsIndicateurs: DétailsIndicateurs
  indicateurs: Indicateur[],
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[],
  territoireCode?: string
  territoireProjetStructurant?: ProjetStructurant['territoire']
  typeDeRéforme: TypeDeRéforme
}
