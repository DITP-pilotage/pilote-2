export interface ImportSyntheseDesResultatsSuccessResponse {
  message: string;
}

export interface ImportSyntheseDesResultatsErreur {
  index: number;
  territoire: string;
  message: string;
}

export interface ImportSyntheseDesResultatsErrorResponse {
  message: string;
  erreurs: ImportSyntheseDesResultatsErreur[];
}

export type ImportSyntheseDesResultatsAPIResponse =
  | ImportSyntheseDesResultatsSuccessResponse
  | ImportSyntheseDesResultatsErrorResponse;
