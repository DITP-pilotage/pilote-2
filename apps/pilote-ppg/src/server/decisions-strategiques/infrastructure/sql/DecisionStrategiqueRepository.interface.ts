import { Chantier } from "@/shared/chantier/Chantier.interface";
import {
  DecisionStrategiqueV2,
  DécisionStratégique,
} from "@/shared/chantier/decisionStrategique/DecisionStrategique.interface";

export interface DécisionStratégiqueRepository {
  save(décision: DecisionStrategiqueV2): Promise<void>;
  getById(id: string): Promise<DecisionStrategiqueV2 | null>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], DécisionStratégique>>;
}
