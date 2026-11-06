// Paragraphes OpenAPI communs aux routes qui adressent des cellules (POC
// dimensions, cf. docs/architecture/dimensions-design.md).

export const DESCRIPTION_CELLULES_LECTURE =
  ' **Dimensions** : chaque identifiant demandé est une *cellule* — un individu (indicateur ' +
  'mono-dimension, comportement historique inchangé) ou plusieurs membres de dimensions distinctes ' +
  'joints par `~` (ex. `DEPT-84~OP-ORANGE`). Sur un indicateur multi-dimension, une dimension absente ' +
  'vaut « tous » (marginale, ex. `DEPT-84` = tous opérateurs), calculée par cascade canonique ' +
  "(ordre des dimensions de l'indicateur). Le champ `individu` des réponses reprend la cellule demandée."

export const DESCRIPTION_CELLULES_ECRITURE =
  ' **Dimensions** : la cible est `individu` (forme historique) ou `coordonnees` (un membre par ' +
  "dimension de l'indicateur). Sur un indicateur multi-dimension, on n'écrit que sur une cellule " +
  'feuille. Erreurs : `COORDONNEE_MANQUANTE` (dimension sans membre alors que sa marginale agrège), ' +
  '`DIMENSION_NON_DECLAREE`, `COORDONNEES_EN_DOUBLE`, `CELLULE_AGREGEE` (membre agrégé), ' +
  "`INDIVIDU_INCONNU` ; `HORS_PERIMETRE` (403) si la cellule sort du périmètre d'écriture du principal."
