export interface ImportCommentaireSuccessResponse {
  message: string;
}

export interface ImportCommentaireErreur {
  index: number;
  territoire: string;
  type: string;
  message: string;
}

export interface ImportCommentaireErrorResponse {
  message: string;
  erreurs: ImportCommentaireErreur[];
}

export type ImportCommentaireAPIResponse =
  | ImportCommentaireSuccessResponse
  | ImportCommentaireErrorResponse;
