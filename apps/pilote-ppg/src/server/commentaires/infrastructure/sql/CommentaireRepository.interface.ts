import {
  Commentaire,
  CommentaireV2,
} from "@/shared/chantier/commentaire/Commentaire.interface";
import { Chantier } from "@/shared/chantier/Chantier.interface";

export interface CommentaireRepository {
  save(commentaire: CommentaireV2): Promise<void>;
  getById(id: string): Promise<CommentaireV2 | null>;
  récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
    territoireCode: string,
  ): Promise<Record<Chantier["id"], Commentaire[]>>;
}
