import {
  Commentaire,
  CommentaireV2,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";

export default interface CommentaireRepository {
  save(commentaire: CommentaireV2): Promise<void>;
  récupérerLesPlusRécentsGroupésParChantier(
    chantiersIds: Chantier["id"][],
    territoireCode: string,
  ): Promise<Record<Chantier["id"], Commentaire[]>>;
}
