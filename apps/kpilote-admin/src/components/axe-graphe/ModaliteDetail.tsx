import { type FonctionAgregationAxe, type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'
import { Plus } from 'lucide-react'

import { ConfirmDeleteButton } from '@/components/axe-graphe/ConfirmDeleteButton'
import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { ModaliteChip } from '@/components/axe-graphe/ModaliteChip'
import { PanelSection } from '@/components/axe-graphe/PanelSection'
import { RenameForm } from '@/components/axe-graphe/RenameForm'
import { Button } from '@pilote/kpilote-ui/Button'
import {
  ancestorsOf,
  type Arbre,
  type ArbreNode,
  fonctionLabel,
  formatValue,
  formulaOf,
  type Kind,
  pluralize,
  TOUS_ID,
} from '@/lib/axeArbre'
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

function ValueOrigin({
  node,
  childNodes,
  isSimulating,
  fonction,
  valeurs,
  onSelect,
}: {
  node: ArbreNode
  childNodes: ReadonlyArray<ArbreNode>
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  valeurs: Map<string, Cellule>
  onSelect: (id: string) => void
}) {
  if (node.kind === 'feuille') {
    return (
      <p className="text-text-muted">
        Elle est <strong className="text-text">saisie</strong> directement, pour chaque individu et
        chaque date. Rien ne la calcule.
      </p>
    )
  }
  if (childNodes.length === 0) {
    return <p className="text-text-muted">Aucune modalité : rien à calculer pour l’instant.</p>
  }
  const valeurOf = (id: string) => {
    const value = valeurs.get(id)?.value
    return value === null || value === undefined ? '∅' : formatValue(value)
  }
  const hasAbsentChild = childNodes.some((child) => valeurs.get(child.id)?.value == null)
  return (
    <>
      <p className="text-text-muted">
        Jamais saisie : c’est la{' '}
        <strong className="text-text">
          {isSimulating ? fonctionLabel(fonction) : 'somme ou la moyenne'}
        </strong>{' '}
        de ses {pluralize({ count: childNodes.length, word: 'enfant' })}
        {isSimulating ? '' : ', selon l’indicateur'}.
      </p>
      <div className="rounded-md bg-surface-muted px-3 py-2 font-mono text-xs leading-relaxed text-text">
        <div>
          {node.nom} = {formulaOf({ terms: childNodes.map((child) => child.nom), fonction })}
        </div>
        {isSimulating ? (
          <>
            <div className="text-text-muted">
              = {formulaOf({ terms: childNodes.map((child) => valeurOf(child.id)), fonction })}
            </div>
            <div className="font-semibold">= {valeurOf(node.id)}</div>
          </>
        ) : null}
      </div>
      {isSimulating && hasAbsentChild ? (
        <p className="text-xs text-warning">
          ∅ = absente : elle sort du calcul, elle ne compte pas comme 0.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {childNodes.map((child) => (
          <ModaliteChip key={child.id} node={child} onSelect={onSelect} />
        ))}
      </div>
    </>
  )
}
