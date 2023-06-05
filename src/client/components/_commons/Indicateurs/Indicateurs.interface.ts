import { ÉlémentPageIndicateursType } from '@/client/utils/rubriques';
import { TypeDeRéforme } from '@/components/PageAccueil/SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[]
  typeDeRéforme: TypeDeRéforme
  territoireProjetStructurant?: ProjetStructurant['territoire']
  estDisponibleALImport?: boolean
  estInteractif?: boolean
}
