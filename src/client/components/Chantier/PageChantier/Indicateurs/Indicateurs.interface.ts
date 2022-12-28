import { Rubrique } from '@/components/Chantier/PageChantier/Sommaire/Sommaire.interface';
import Type from '@/server/domain/indicateur/Type.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: Type };

export default interface RubriquesIndicateursProps {
  listeRubriquesIndicateurs: ÉlémentPageIndicateursType[];
  indicateurs: Indicateur[];
}
