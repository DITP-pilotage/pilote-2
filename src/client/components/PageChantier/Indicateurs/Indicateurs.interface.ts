import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import Type from '@/server/domain/indicateur/Type.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<Type> };

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
}
