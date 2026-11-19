import { type FonctionAgregationAxe, type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'

import { AddModaliteForm } from '@/components/axe-graphe/AddModaliteForm'
import { ModaliteDetail } from '@/components/axe-graphe/ModaliteDetail'
import { NiveauDetail } from '@/components/axe-graphe/NiveauDetail'
import { type Arbre, TOUS_ID } from '@/lib/axeArbre'
import { type Selection } from '@/lib/axeGraphe'
import { type Cellule } from '@/lib/axeSerie'
import { type AxeEdition } from '@/mutations/axes'

export function SelectionPanel({
  selection,
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
  selection: NonNullable<Selection>
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
  if (selection.type === 'niveau') {
    return (
      <NiveauDetail
        key={selection.ordre}
        ordre={selection.ordre}
        niveaux={niveaux}
        arbre={arbre}
        niveauNomOf={niveauNomOf}
        isEditing={isEditing}
        locked={locked}
        edition={edition}
        onSelect={onSelect}
        onAdd={onAdd}
        onDeleted={onDeleted}
      />
    )
  }
  if (selection.type === 'ajout') {
    return (
      <AddModaliteForm
        key={selection.parent ?? TOUS_ID}
        parent={selection.parent ? (arbre.get(selection.parent) ?? null) : null}
        niveauNomOf={niveauNomOf}
        arbre={arbre}
        edition={edition}
        locked={locked}
        onCreated={onSelect}
      />
    )
  }
  const node = arbre.get(selection.id)
  if (!node) return null
  return (
    <ModaliteDetail
      key={node.id}
      node={node}
      arbre={arbre}
      niveaux={niveaux}
      niveauNomOf={niveauNomOf}
      isSimulating={isSimulating}
      fonction={fonction}
      valeurs={valeurs}
      isEditing={isEditing}
      locked={locked}
      edition={edition}
      onSelect={onSelect}
      onAdd={onAdd}
      onDeleted={onDeleted}
    />
  )
}
