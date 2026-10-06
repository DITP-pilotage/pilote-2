import { Chantier } from "@/shared/chantier/Chantier.interface";
import {
  Objectif,
  ObjectifV2,
} from "@/shared/chantier/objectif/Objectif.interface";

export interface ObjectifRepository {
  save(objectif: ObjectifV2): Promise<void>;
  getById(id: string): Promise<ObjectifV2 | null>;
  récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], Objectif[]>>;
}
