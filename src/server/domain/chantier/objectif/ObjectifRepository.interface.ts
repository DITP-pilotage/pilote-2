import Chantier from "@/server/domain/chantier/Chantier.interface";
import Objectif, { ObjectifV2 } from "./Objectif.interface";

export default interface ObjectifRepository {
  save(objectif: ObjectifV2): Promise<void>;
  getById(id: string): Promise<ObjectifV2 | null>;
  récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], Objectif[]>>;
}
