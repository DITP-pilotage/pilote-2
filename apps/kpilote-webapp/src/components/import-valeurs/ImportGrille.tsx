import {
  type CiblesSaisieApiModel,
  type PlanTransformation,
} from '@pilote/kpilote-shared/valeurImport'
import { type LigneImport } from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { Check, TriangleAlert } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { GrilleValeurs } from '@/components/grille-valeurs/GrilleValeurs'
import { clsxm } from '@/lib/clsxm'
import { type PositionCellule } from '@/lib/grilleValeurs'

import { CelluleEditor, type CorrectionSaisie } from './CelluleEditor'
import { ErreursServeurBloc } from './ErreursServeurBloc'
import {
  buildLignesGrille,
  buildNomById,
  describeEdition,
  describeProvenance,
  filterLignes,
  type FiltreGrille,
  listColonnesGrille,
  summarizeLignes,
} from './grille'
import { pluralize } from './pluralize'

function Pastille({ tone, children }: { tone: 'success' | 'warning'; children: React.ReactNode }) {
  return (
    <span
      className={clsxm(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium',
        tone === 'success' ? 'bg-success-tinted text-success' : 'bg-warning-tinted text-warning',
      )}
    >
      {children}
    </span>
  )
}

function FiltreBouton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={clsxm(
        'rounded-md px-3 py-1.5 text-[13px]',
        isActive ? 'bg-surface font-bold text-primary shadow-raised' : 'font-medium text-text',
      )}
    >
      {children}
    </button>
  )
}

const describeLecture = ({
  origine,
  lignesEcartees,
}: {
  origine: 'STANDARD' | 'ALBERT'
  lignesEcartees: number
}): string => {
  const lecture =
    origine === 'ALBERT' ? 'Fichier lu par l’assistant IA' : 'Fichier au format standard'
  if (lignesEcartees === 0) return lecture
  const ecartees = pluralize({
    count: lignesEcartees,
    singular: 'ligne d’un autre type de valeur écartée',
    plural: 'lignes d’un autre type de valeur écartées',
  })
  return `${lecture} · ${lignesEcartees} ${ecartees}`
}

// Grille au format cible de l'import : une ligne par valeur, une cellule
// sélectionnée dont la barre dit la provenance, et la correction en place.
export function ImportGrille({
  lignes,
  lignesEcartees,
  plan,
  cibles,
  origine,
  erreursServeur,
  onCorrection,
}: {
  lignes: ReadonlyArray<LigneImport>
  lignesEcartees: number
  plan: PlanTransformation
  cibles: CiblesSaisieApiModel
  origine: 'STANDARD' | 'ALBERT'
  erreursServeur: string[]
  onCorrection: (params: { ligne: LigneImport; correction: CorrectionSaisie }) => void
}) {
  const [filtre, setFiltre] = useState<FiltreGrille>('TOUTES')
  const [selection, setSelection] = useState<PositionCellule>({ ligne: 0, colonne: 0 })
  const [isEditing, setIsEditing] = useState(false)

  const colonnes = useMemo(() => listColonnesGrille({ plan, cibles }), [plan, cibles])
  const nomById = useMemo(() => buildNomById(cibles), [cibles])
  const lignesGrille = useMemo(() => buildLignesGrille({ lignes, nomById }), [lignes, nomById])
  const visibles = useMemo(
    () => filterLignes({ lignes: lignesGrille, filtre }),
    [lignesGrille, filtre],
  )
  const { pretes, aCorriger } = summarizeLignes(lignesGrille)

  const selectedLigne = lignes[selection.ligne]
  const selectedColonne = colonnes[selection.colonne]
  const hasSelection = selectedLigne !== undefined && selectedColonne !== undefined
  const edition = hasSelection
    ? describeEdition({ ligne: selectedLigne, colonne: selectedColonne, cibles })
    : null
  const provenance = hasSelection
    ? describeProvenance({
        ligne: selectedLigne,
        numero: selection.ligne + 1,
        colonne: selectedColonne,
        plan,
        nomById,
      })
    : null

  const onSelect = useCallback((position: PositionCellule) => {
    setSelection(position)
    setIsEditing(false)
  }, [])
  // Entrée, F2 ou double clic n'ouvrent l'éditeur que sur une cellule qu'on peut corriger.
  const onEdit = useCallback(
    (position: PositionCellule) => {
      setSelection(position)
      const ligne = lignes[position.ligne]
      const colonne = colonnes[position.colonne]
      const isEditable =
        ligne !== undefined &&
        colonne !== undefined &&
        describeEdition({ ligne, colonne, cibles }) !== null
      setIsEditing(isEditable)
    },
    [lignes, colonnes, cibles],
  )
  const onCloseEditor = useCallback(() => setIsEditing(false), [])

  const submitCorrection = (correction: CorrectionSaisie) => {
    if (!selectedLigne) return
    onCorrection({ ligne: selectedLigne, correction })
    setIsEditing(false)
  }

  const editor =
    isEditing && edition ? (
      <CelluleEditor edition={edition} onCorrection={submitCorrection} />
    ) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ErreursServeurBloc messages={erreursServeur} />

      <div className="flex flex-wrap items-center gap-3 pb-3">
        <Pastille tone="success">
          <Check aria-hidden className="size-3.5" strokeWidth={3} />
          {pretes}{' '}
          {pluralize({ count: pretes, singular: 'valeur prête', plural: 'valeurs prêtes' })}
        </Pastille>
        {aCorriger > 0 ? (
          <Pastille tone="warning">
            <TriangleAlert aria-hidden className="size-3.5" />
            {aCorriger} à corriger
          </Pastille>
        ) : null}
        <div className="ml-2 flex gap-0.5 rounded-lg bg-surface-muted p-[3px]">
          <FiltreBouton isActive={filtre === 'TOUTES'} onClick={() => setFiltre('TOUTES')}>
            Toutes les lignes
          </FiltreBouton>
          <FiltreBouton isActive={filtre === 'A_CORRIGER'} onClick={() => setFiltre('A_CORRIGER')}>
            À corriger
          </FiltreBouton>
        </div>
        <span className="ml-auto text-[13px] text-text-muted">
          {describeLecture({ origine, lignesEcartees })}
        </span>
      </div>

      <div className="flex h-10 shrink-0 items-center rounded-t-lg border border-b-0 border-border-strong bg-surface">
        <div className="w-52 shrink-0 truncate border-r border-border px-3 text-[13px] font-medium leading-[38px]">
          {provenance?.reference ?? ''}
        </div>
        <div
          className="min-w-0 flex-1 truncate px-3 text-[13px] leading-[38px] text-text"
          title={provenance?.texte}
        >
          {provenance?.texte ?? ''}
        </div>
        {edition ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mr-1.5 whitespace-nowrap rounded-md border border-secondary-border bg-secondary px-3 py-1 text-[13px] font-bold text-secondary-foreground hover:bg-secondary-hover"
          >
            {edition.action}
          </button>
        ) : null}
      </div>

      <GrilleValeurs
        label="Valeurs à importer"
        colonnes={colonnes}
        lignes={visibles}
        selection={selection}
        onSelect={onSelect}
        editor={editor}
        onEdit={onEdit}
        onCloseEditor={onCloseEditor}
        emptyMessage="Aucune ligne à corriger : toutes les valeurs sont prêtes."
      />
    </div>
  )
}
