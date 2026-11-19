import { type AxeApiModel, type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { type DeclarationAxeIndicateur } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries, type UseSuspenseQueryResult } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useMemo } from 'react'

import { AxesOrder } from '@/components/axes-croises/AxesOrder'
import { CroisementTable } from '@/components/axes-croises/CroisementTable'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import { buildArbre, withTousNamed } from '@/lib/axeArbre'
import { type AxeCroise } from '@/lib/axesCroises'
import { axeModalitesQueryOptions } from '@/queries/axes'

// Hors du composant : une fonction stable laisse useSuspenseQueries mémoriser le résultat, et
// garde le cache du moteur croisé d'un rendu à l'autre.
const dataOf = (results: ReadonlyArray<UseSuspenseQueryResult<ModaliteApiModel[]>>) =>
  results.map((result) => result.data)

export function AxesCroises({
  declarations,
  axes,
  onClose,
}: {
  declarations: ReadonlyArray<DeclarationAxeIndicateur>
  axes: ReadonlyArray<AxeApiModel>
  onClose: () => void
}) {
  const modalitesByAxe = useSuspenseQueries({
    queries: declarations.map((declaration) => axeModalitesQueryOptions(declaration.id)),
    combine: dataOf,
  })
  const axesCroises = useMemo(
    () =>
      declarations.map((declaration, index): AxeCroise => {
        const nom = axes.find((axe) => axe.id === declaration.id)?.nom ?? declaration.id
        return {
          id: declaration.id,
          nom,
          fonction: declaration.fonction,
          arbre: withTousNamed({ arbre: buildArbre(modalitesByAxe[index] ?? []), axeNom: nom }),
        }
      }),
    [declarations, axes, modalitesByAxe],
  )
  const orderKey = declarations.map((declaration) => declaration.id).join(',')

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <div className="mr-auto">
          <Dialog.Title>Calcul croisé des axes</Dialog.Title>
          <Dialog.Description className="text-xs">
            Un exemple de valeurs pour un individu : on saisit sur une feuille de chaque axe, le
            reste se calcule axe par axe, dans l’ordre de déclaration.
          </Dialog.Description>
        </div>
        <AxesOrder axes={axesCroises} />
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="rounded-md p-1.5 text-text-subtle hover:bg-surface-muted hover:text-text"
        >
          <X className="size-[18px]" />
        </button>
      </header>
      <CroisementTable key={orderKey} axes={axesCroises} />
    </div>
  )
}
