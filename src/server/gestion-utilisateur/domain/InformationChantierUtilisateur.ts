export interface InformationChantierUtilisateur {
  id: string,
  nom: string,
  estTerritorialise: boolean | null,
  perimetreIds: string[],
  statut: string,
  ate: string | null
}
