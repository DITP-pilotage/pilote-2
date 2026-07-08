import { type CommentaireStatut } from '@pilote/kpilote-shared/commentaire'

import { clsxm } from '@/lib/clsxm'

export function BadgeStatut({ statut }: { statut: CommentaireStatut }) {
  const brouillon = statut === 'BROUILLON'
  return (
    <span
      className={clsxm(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
        brouillon ? 'bg-warning-tinted text-warning' : 'bg-success-tinted text-success',
      )}
    >
      <span
        className={clsxm('size-1.5 rounded-full', brouillon ? 'bg-warning' : 'bg-success')}
        aria-hidden
      />
      {brouillon ? 'Brouillon' : 'Publié'}
    </span>
  )
}
