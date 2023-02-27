import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import Indicateur, { IndicateurMétriques, IndicateursMétriques, TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type ÉlémentPageIndicateursType = Rubrique & { typeIndicateur: NonNullable<TypeIndicateur> };

export type IndicateurDonnéesParTerritoire = {
  territoire: string
  données: IndicateurMétriques
};

export default interface RubriquesIndicateursProps {
  indicateurs: Indicateur[];
  indicateursMétriques: Record<CodeInsee, IndicateursMétriques>
}
