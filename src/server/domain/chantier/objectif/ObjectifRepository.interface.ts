import Chantier from "@/server/domain/chantier/Chantier.interface";
import Objectif, { ObjectifV2, TypeObjectif } from "./Objectif.interface";

export default interface ObjectifRepository {
  save(objectif: ObjectifV2): Promise<void>;
  getById(id: string): Promise<ObjectifV2 | null>;
  récupérerHistorique(
    chantierId: string,
    type: TypeObjectif,
  ): Promise<Objectif[]>;
  récupérerLePlusRécent(
    chantierId: string,
    type: TypeObjectif,
  ): Promise<Objectif>;
  créer(
    chantierId: string,
    id: string,
    contenu: string,
    auteur: string,
    type: TypeObjectif,
    date: Date,
  ): Promise<Objectif>;
  récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
  ): Promise<Record<Chantier["id"], Objectif[]>>;
}
