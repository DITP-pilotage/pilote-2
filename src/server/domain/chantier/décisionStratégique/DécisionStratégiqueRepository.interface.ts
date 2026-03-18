import Chantier from "@/server/domain/chantier/Chantier.interface";
import {
  DecisionStrategiqueV2,
  DécisionStratégique,
} from "./DécisionStratégique.interface";

export default interface DécisionStratégiqueRepository {
  save(décision: DecisionStrategiqueV2): Promise<void>;
  getById(id: string): Promise<DecisionStrategiqueV2 | null>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], DécisionStratégique>>;
}
