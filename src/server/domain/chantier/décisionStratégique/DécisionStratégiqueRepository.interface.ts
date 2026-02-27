import Chantier from "@/server/domain/chantier/Chantier.interface";
import DécisionStratégique, {
  DécisionStratégiqueV2,
  TypeDécisionStratégique,
} from "./DécisionStratégique.interface";

export default interface DécisionStratégiqueRepository {
  save(décision: DécisionStratégiqueV2): Promise<void>;
  récupérerLaPlusRécente(chantierId: string): Promise<DécisionStratégique>;
  récupérerHistorique(chantierId: string): Promise<DécisionStratégique[]>;
  créer(
    chantierId: string,
    id: string,
    contenu: string,
    type: TypeDécisionStratégique,
    auteur: string,
    date: Date,
  ): Promise<DécisionStratégique>;
  récupérerLesPlusRécentesGroupéesParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], DécisionStratégique>>;
}
