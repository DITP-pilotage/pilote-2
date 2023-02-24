import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import Indicateur, { IndicateursMétriques, IndicateurTerritorialisé, TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<TypeIndicateur> };

export type IndicateurDonnéesParTerritoire = {
  territoire: string
  données: IndicateurTerritorialisé
};

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  indicateursMétriques: IndicateursMétriques
}
