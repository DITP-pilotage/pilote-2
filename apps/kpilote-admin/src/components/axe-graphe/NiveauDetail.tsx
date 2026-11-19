import { type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'
import { Plus } from 'lucide-react'

import { ConfirmDeleteButton } from '@/components/axe-graphe/ConfirmDeleteButton'
import { ModaliteChip } from '@/components/axe-graphe/ModaliteChip'
import { PanelSection } from '@/components/axe-graphe/PanelSection'
import { RenameForm } from '@/components/axe-graphe/RenameForm'
import { Button } from '@pilote/kpilote-ui/Button'
import { type Arbre, pluralize } from '@/lib/axeArbre'
import { type AxeEdition } from '@/mutations/axes'

export function NiveauDetail({
  ordre,
  niveaux,
  arbre,
  niveauNomOf,
  isEditing,
  locked,
  edition,
  onSelect,
  onAdd,
  onDeleted,
}: {
  ordre: number
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  arbre: Arbre
  niveauNomOf: (ordre: number) => string
  isEditing: boolean
  locked: boolean
  edition: AxeEdition
  onSelect: (id: string) => void
  onAdd: (parent: string | null) => void
  onDeleted: () => void
}) {
  const nodes = [...arbre.values()]
  const members = nodes.filter((node) => node.niveau === ordre)
  const possibleParents = nodes.filter((node) => node.niveau === ordre - 1)
  const isFirst = ordre === 1
  const isLast = ordre === niveaux.length
  const names = niveaux.map((niveau) => niveau.nom)
  const isDisabled = locked || edition.isPending
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="text-xs text-text-muted">
          Niveau {ordre} sur {niveaux.length}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-text">{niveauNomOf(ordre)}</h3>
        <p className="text-xs text-text-muted">
          Un étage de l’axe, qui regroupe des modalités de même finesse.
        </p>
      </div>
      <PanelSection title="Sa place dans l’axe">
        <p className="text-text-muted">
          {isFirst
            ? 'Le plus large : ses modalités n’ont pas de parent et entrent directement dans « Tous ».'
            : `Chacune de ses modalités a un parent au niveau « ${niveauNomOf(ordre - 1)} ».`}{' '}
          {isLast
            ? 'C’est le plus fin : ses modalités sont toutes des feuilles.'
            : `Ses modalités se découpent au niveau « ${niveauNomOf(ordre + 1)} » ; celles qui ne se découpent pas restent des feuilles.`}
        </p>
      </PanelSection>
      <PanelSection title={pluralize({ count: members.length, word: 'modalité' })}>
        {members.length === 0 ? (
          <p className="text-text-muted">Aucune modalité.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {members.map((member) => (
              <ModaliteChip key={member.id} node={member} onSelect={onSelect} />
            ))}
          </div>
        )}
      </PanelSection>

      {isEditing ? (
        <PanelSection title="Modifier">
          <RenameForm
            key={niveauNomOf(ordre)}
            initial={niveauNomOf(ordre)}
            disabled={isDisabled}
            onSave={(nom) =>
              edition.saveNiveaux({
                names: names.map((current, index) => (index === ordre - 1 ? nom : current)),
              })
            }
          />
          <AddUnderParent
            ordre={ordre}
            possibleParents={possibleParents}
            niveauNomOf={niveauNomOf}
            locked={locked}
            onAdd={onAdd}
          />
          {isLast && niveaux.length > 1 ? (
            <ConfirmDeleteButton
              label="Supprimer ce niveau"
              blockedReason={members.length > 0 ? 'Supprimez d’abord ses modalités.' : undefined}
              disabled={isDisabled}
              onConfirm={() =>
                edition.saveNiveaux({ names: names.slice(0, -1), onSuccess: onDeleted })
              }
            />
          ) : null}
        </PanelSection>
      ) : null}
    </div>
  )
}

function AddUnderParent({
  ordre,
  possibleParents,
  niveauNomOf,
  locked,
  onAdd,
}: {
  ordre: number
  possibleParents: ReadonlyArray<{ id: string; nom: string }>
  niveauNomOf: (ordre: number) => string
  locked: boolean
  onAdd: (parent: string | null) => void
}) {
  if (ordre === 1) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="self-start"
        disabled={locked}
        onClick={() => onAdd(null)}
      >
        <Plus /> Ajouter une modalité
      </Button>
    )
  }
  if (possibleParents.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Ajoutez d’abord une modalité au niveau « {niveauNomOf(ordre - 1)} ».
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-muted">Ajouter une modalité ici, sous :</span>
      <div className="flex flex-wrap gap-1.5">
        {possibleParents.map((parent) => (
          <button
            key={parent.id}
            type="button"
            disabled={locked}
            onClick={() => onAdd(parent.id)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary-tinted disabled:opacity-50"
          >
            <Plus className="size-3" /> {parent.nom}
          </button>
        ))}
      </div>
    </div>
  )
}
