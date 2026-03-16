import Chantier from "@/server/domain/chantier/Chantier.interface";
import DécisionStratégique, {
  DecisionStrategiqueV2,
  TypeDecisionStrategique,
} from "./DécisionStratégique.interface";

export default interface DécisionStratégiqueRepository {
  save(décision: DecisionStrategiqueV2): Promise<void>;
  getById(id: string): Promise<DecisionStrategiqueV2 | null>;
  récupérerLaPlusRécente(chantierId: string): Promise<DécisionStratégique>;
  récupérerHistorique(chantierId: string): Promise<DécisionStratégique[]>;
  créer(
    chantierId: string,
    id: string,
    contenu: string,
    type: TypeDecisionStrategique,
    auteur: string,
    date: Date,
  ): Promise<DécisionStratégique>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], DécisionStratégique>>;
}
