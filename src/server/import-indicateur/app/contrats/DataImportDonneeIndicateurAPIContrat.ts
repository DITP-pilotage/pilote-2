export interface ImportDonneeIndicateurAPIContrat {
  identifiant_indic: string
  zone_id: string
  zone_nom: string
  date_valeur: string
  type_valeur: string
  valeur: string
}

export interface DataImportDonneeIndicateurAPIContrat {
  donnees: ImportDonneeIndicateurAPIContrat[]
}
