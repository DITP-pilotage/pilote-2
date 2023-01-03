import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import Indicateur, { TypesAvancement } from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<TypesAvancement> };

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
}
