export interface InformationChantierUtilisateur {
  id: string,
  estTerritorialise: boolean | null,
  perimetreIds: string[],
  statut: string,
  ate: string | null
}
