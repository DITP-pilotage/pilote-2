import { type Kind } from '@/lib/axeArbre'
import { type CelluleStatut } from '@/lib/axeSerie'
import { type TableurTone } from '@/lib/axeTableur'

export const STATUT_CLASS: Record<CelluleStatut, string> = {
  saisie: 'text-text',
  reportee: 'text-text-subtle italic',
  manquante: 'bg-warning-tinted/60 text-warning',
  absente: 'text-text-subtle',
  calculee: 'text-text',
}

// Même règle que le calcul croisé : une ligne blanche se saisit, une ligne teintée se calcule,
// plus foncée pour la marginale « Tous ».
export const KIND_ROW_CLASS: Record<Kind, string> = {
  feuille: 'bg-surface',
  parente: 'bg-surface-muted font-semibold',
  tous: 'bg-surface-tinted font-bold',
}

export const TONE_CLASS: Record<TableurTone, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
  dependent: 'bg-primary-tinted/40',
}
