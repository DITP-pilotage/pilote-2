export interface ImportObjectifSuccessResponse {
  message: string;
}

export interface ImportObjectifErreur {
  index: number;
  type: string;
  message: string;
}

export interface ImportObjectifErrorResponse {
  message: string;
  erreurs: ImportObjectifErreur[];
}

export type ImportObjectifAPIResponse =
  | ImportObjectifSuccessResponse
  | ImportObjectifErrorResponse;
