import { Rubrique } from '@/components/_commons/Sommaire/Sommaire.interface';
import { DétailsIndicateurs } from '@/server/domain/chantier/indicateur/DétailsIndicateur.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/chantier/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: TypeIndicateur };

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  détailsIndicateurs: DétailsIndicateurs
  estDisponibleALImport?: boolean
  estInteractif?: boolean
}
