import { DecisionStrategique } from '@/server/fiche-conducteur/domain/DecisionStrategique';

export interface DecisionStrategiqueRepository {
  listerDecisionStrategiqueParChantierId: ({ chantierId }: { chantierId: string }) => Promise<DecisionStrategique[]>
}
