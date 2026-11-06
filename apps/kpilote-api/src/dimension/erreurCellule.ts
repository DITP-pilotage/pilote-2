import { type ErreurCellule } from '@/dimension/celluleEcriture'

const MESSAGES: Record<ErreurCellule['type'], string> = {
  INDIVIDU_INCONNU:
    "L'individu est inconnu ou n'est pas rattaché à un référentiel lié à l'indicateur",
  DIMENSION_NON_DECLAREE: "La dimension de ce membre n'est pas déclarée sur l'indicateur",
  COORDONNEES_EN_DOUBLE: 'Plusieurs membres de la même dimension dans une cellule',
  COORDONNEE_MANQUANTE:
    "Coordonnée manquante : une valeur se saisit sur une cellule complète (un membre par dimension de l'indicateur)",
  CELLULE_AGREGEE:
    'Cellule agrégée : sa valeur est dérivée de ses enfants, on ne la saisit pas (saisir le membre feuille, ex. « non ventilé »)',
  HORS_PERIMETRE: "Cellule hors du périmètre d'écriture du principal",
}

// Traduction d'une erreur de cellule en réponse API (400, ou 403 pour le
// cloisonnement). Les détails gardent `individu` pour la forme historique.
export const erreurCelluleApi = (
  error: ErreurCellule,
): {
  status: 400 | 403
  error: { code: string; message: string; details: Record<string, string> }
} => {
  const { type, ...details } = error
  return {
    status: type === 'HORS_PERIMETRE' ? 403 : 400,
    error: { code: type, message: MESSAGES[type], details },
  }
}
