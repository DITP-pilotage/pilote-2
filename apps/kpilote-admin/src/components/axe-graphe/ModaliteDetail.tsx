import { type FonctionAgregationAxe, type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'
import { Plus } from 'lucide-react'

import { ConfirmDeleteButton } from '@/components/axe-graphe/ConfirmDeleteButton'
import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { ModaliteChip } from '@/components/axe-graphe/ModaliteChip'
import { PanelSection } from '@/components/axe-graphe/PanelSection'
import { RenameForm } from '@/components/axe-graphe/RenameForm'
import { ValueOrigin } from '@/components/axe-graphe/ValueOrigin'
import { Button } from '@pilote/kpilote-ui/Button'
import { ancestorsOf, type Arbre, type ArbreNode, type Kind, TOUS_ID } from '@/lib/axeArbre'
import { type Cellule } from '@/lib/axeSerie'
import { type AxeEdition } from '@/mutations/axes'

const KIND_LABEL: Record<Kind, string> = {
  feuille: 'Modalité feuille · saisie',
  parente: 'Modalité parente · calculée',
  tous: 'Tous',
}

export function ModaliteDetail({
  node,
  arbre,
  niveaux,
  niveauNomOf,
  isSimulating,
  fonction,
  valeurs,
  isEditing,
  locked,
  edition,
  onSelect,
  onAdd,
  onDeleted,
}: {
  node: ArbreNode
  arbre: Arbre
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  niveauNomOf: (ordre: number) => string
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  valeurs: Map<string, Cellule>
  isEditing: boolean
  locked: boolean
  edition: AxeEdition
  onSelect: (id: string) => void
  onAdd: (parent: string | null) => void
  onDeleted: () => void
}) {
  const children = node.children.flatMap((id) => arbre.get(id) ?? [])
  const isTous = node.kind === 'tous'
  const canHaveChildren = isTous || node.niveau < niveaux.length
  const isDisabled = locked || edition.isPending

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <KindMarker kind={node.kind} shape="large-dot" />
          {KIND_LABEL[node.kind]}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-text">{node.nom}</h3>
        <p className="text-xs text-text-muted">
          {isTous ? (
            'Ensemble de l’axe, calculé à la lecture, jamais stocké.'
          ) : (
            <>
              <code className="text-primary">{node.id}</code> · niveau {node.niveau} «{' '}
              {niveauNomOf(node.niveau)} »
            </>
          )}
        </p>
      </div>

      <PanelSection title="D’où vient sa valeur">
        <ValueOrigin
          node={node}
          childNodes={children}
          isSimulating={isSimulating}
          fonction={fonction}
          valeurs={valeurs}
          onSelect={onSelect}
        />
      </PanelSection>

      {isTous ? null : (
        <PanelSection title="Ce qu’elle alimente">
          <div className="flex flex-wrap items-center gap-1.5">
            <ModaliteChip node={node} onSelect={onSelect} />
            {ancestorsOf({ arbre, id: node.id }).map((ancestor) => (
              <span key={ancestor.id} className="inline-flex items-center gap-1.5">
                <span className="text-text-subtle">→</span>
                <ModaliteChip node={ancestor} onSelect={onSelect} />
              </span>
            ))}
          </div>
        </PanelSection>
      )}

      {isEditing ? (
        <PanelSection title="Modifier">
          {isTous ? null : (
            <RenameForm
              key={node.nom}
              initial={node.nom}
              disabled={isDisabled}
              onSave={(nom) =>
                edition.saveModalite({
                  id: node.id,
                  nom,
                  parent: node.parent === TOUS_ID ? null : node.parent,
                })
              }
            />
          )}
          <div className="flex flex-wrap gap-2">
            {canHaveChildren ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={locked}
                onClick={() => onAdd(isTous ? null : node.id)}
              >
                <Plus /> {isTous ? 'Modalité au niveau 1' : 'Ajouter un enfant'}
              </Button>
            ) : null}
            {isTous ? null : (
              <ConfirmDeleteButton
                blockedReason={children.length > 0 ? 'Supprimez d’abord ses enfants.' : undefined}
                disabled={isDisabled}
                onConfirm={() => edition.deleteModalite({ id: node.id, onSuccess: onDeleted })}
              />
            )}
          </div>
          {isTous ? null : (
            <p className="text-xs text-text-subtle">
              Pour changer son parent ou son niveau : la supprimer, puis la recréer au bon endroit.
            </p>
          )}
        </PanelSection>
      ) : null}
    </div>
  )
}
