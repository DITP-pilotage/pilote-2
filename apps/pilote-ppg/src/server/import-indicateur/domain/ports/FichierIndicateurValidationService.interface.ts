import { DetailValidationFichier } from "@/server/import-indicateur/domain/DetailValidationFichier";

export type ValiderFichierPayload = {
  cheminCompletDuFichier: string;
  nomDuFichier: string;
  /** Nom du fichier de schema, ex. "sans-contraintes.json". */
  schema: string;
  utilisateurEmail: string;
};
export interface FichierIndicateurValidationService {
  validerFichier(
    payload: ValiderFichierPayload,
  ): Promise<DetailValidationFichier>;
}
