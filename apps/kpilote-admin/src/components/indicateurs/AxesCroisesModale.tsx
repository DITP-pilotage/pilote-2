import { type AxeApiModel, type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { type DeclarationAxeIndicateur } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries, type UseSuspenseQueryResult } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Suspense, useMemo } from 'react'

import { CroisementTable } from '@/components/indicateurs/CroisementTable'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import { buildArbre, fonctionLabel, withTousNamed } from '@/lib/axeArbre'
import { type AxeCroise } from '@/lib/axesCroises'
import { axeModalitesQueryOptions } from '@/queries/axes'

export function AxesCroisesModale({
  open,
  onClose,
  declarations,
  axes,
}: {
  open: boolean
  onClose: () => void
  declarations: ReadonlyArray<DeclarationAxeIndicateur>
  axes: ReadonlyArray<AxeApiModel>
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="top-4 h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)]">
          <Suspense
            fallback={<p className="p-6 text-sm text-text-muted">Chargement des modalités…</p>}
          >
            <AxesCroises declarations={declarations} axes={axes} onClose={onClose} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

// Hors du composant : une fonction stable laisse useSuspenseQueries mémoriser le résultat, et
// garde le cache du moteur croisé d'un rendu à l'autre.
const dataOf = (results: ReadonlyArray<UseSuspenseQueryResult<ModaliteApiModel[]>>) =>
  results.map((result) => result.data)

function AxesCroises({
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

function AxesOrder({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  return (
    <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 text-xs">
      {axes.map((axe, index) => (
        <li key={axe.id} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-text-subtle">puis</span> : null}
          <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5">
            <b>
              {index + 1}. {axe.nom}
            </b>{' '}
            <span className="text-text-muted">({fonctionLabel(axe.fonction)})</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
