export interface ImportDecisionStrategiqueSuccessResponse {
  message: string;
}

export interface ImportDecisionStrategiqueErreur {
  index: number;
  type: string;
  message: string;
}

export interface ImportDecisionStrategiqueErrorResponse {
  message: string;
  erreurs: ImportDecisionStrategiqueErreur[];
}

export type ImportDecisionStrategiqueAPIResponse =
  | ImportDecisionStrategiqueSuccessResponse
  | ImportDecisionStrategiqueErrorResponse;
