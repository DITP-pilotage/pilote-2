import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { TypeCommentaireAPI } from "@/validation/importCommentaire";

export interface ImportCommentaireContrat {
  territoire: string;
  type: TypeCommentaireAPI;
  contenu: string;
  date_commentaire?: string;
}

export interface CommentaireImporteContrat {
  id: string;
  territoire: string;
  type: TypeCommentaireChantier;
}

export interface ImportCommentaireSuccessResponse {
  success: true;
  message: string;
}

export interface ImportCommentaireErreur {
  index: number;
  territoire: string;
  type: string;
  message: string;
}

export interface ImportCommentaireErrorResponse {
  success: false;
  message: string;
  erreurs: ImportCommentaireErreur[];
}

export type ImportCommentaireAPIResponse =
  | ImportCommentaireSuccessResponse
  | ImportCommentaireErrorResponse;
