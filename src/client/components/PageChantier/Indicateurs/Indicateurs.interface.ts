import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import Indicateur, { IndicateursMétriques, TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<TypeIndicateur> };

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  indicateursMétriques: IndicateursMétriques
}
