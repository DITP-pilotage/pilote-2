import { type CelluleValeur } from '@pilote/kpilote-shared/valeursCombinaison'

export const STATUT_CELL_CLASS: Record<CelluleValeur['statut'], string> = {
  saisie: 'text-text',
  reportee: 'text-text-subtle italic',
  manquante: 'bg-warning-tinted/60 text-warning',
  absente: 'font-normal text-text-subtle',
  calculee: 'text-text',
}
