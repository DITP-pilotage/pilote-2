import { Chantier } from '@/server/chantiers/domain/Chantier.interface';
import { DecisionStrategique, TypeDecisionStrategique } from '../DecisionStrategique.interface';

export interface DecisionStrategiqueRepository {
  récupérerLaPlusRécente(chantierId: string): Promise<DecisionStrategique>
  récupérerHistorique(chantierId: string): Promise<DecisionStrategique[]>
  créer(chantierId: string, id: string, contenu: string, type: TypeDecisionStrategique, auteur: string, date: Date): Promise<DecisionStrategique>
  récupérerLesPlusRécentesGroupéesParChantier(chantiersIds: Chantier['id'][]): Promise<Record<Chantier['id'], DecisionStrategique>>;
}
