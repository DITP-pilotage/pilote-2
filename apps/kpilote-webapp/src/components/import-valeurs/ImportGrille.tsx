import {
  type CiblesSaisieApiModel,
  type PlanTransformation,
} from '@pilote/kpilote-shared/valeurImport'
import { type LigneImport } from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { Check, TriangleAlert } from 'lucide-react'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { clsxm } from '@/lib/clsxm'

import { CelluleEditor, type CorrectionSaisie } from './CelluleEditor'
import { ErreursServeurBloc } from './ErreursServeurBloc'
import {
  buildLignesGrille,
  buildNomById,
  type ColonneGrille,
  describeEdition,
  describeProvenance,
  filterLignes,
  type FiltreGrille,
  listColonnesGrille,
  movePosition,
  type PositionCellule,
  summarizeLignes,
} from './grille'
import { cellDomId, GrilleLigne } from './GrilleLigne'
import { pluralize } from './pluralize'

// Les colonnes d'axe se partagent la place laissée par les autres.
const COLUMN_WIDTH: Record<ColonneGrille['type'], string | undefined> = {
  INDIVIDU: 'w-[26%]',
  AXE: undefined,
  DATE: 'w-32',
  VALEUR: 'w-32',
}

const DELTA_BY_KEY: Record<string, { ligne: number; colonne: number }> = {
  ArrowUp: { ligne: -1, colonne: 0 },
  ArrowDown: { ligne: 1, colonne: 0 },
  ArrowLeft: { ligne: 0, colonne: -1 },
  ArrowRight: { ligne: 0, colonne: 1 },
}

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

function ColonneEntete({ colonne }: { colonne: ColonneGrille }) {
  return (
    <th
      scope="col"
      className={clsxm(
        'sticky top-0 z-[2] border-b border-r border-border-strong bg-surface-muted px-3 font-bold last:border-r-0',
        colonne.type === 'VALEUR' ? 'text-right' : 'text-left',
      )}
    >
      {colonne.label}
      {colonne.type === 'AXE' ? (
        <span className="ml-1.5 rounded bg-primary-tinted px-1.5 py-0.5 text-[11px] font-medium text-primary">
          Axe
        </span>
      ) : null}
    </th>
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

  // La cellule sélectionnée porte le focus : le clavier la suit dans la grille.
  useEffect(() => {
    if (isEditing) return
    const cellule = document.getElementById(cellDomId(selection))
    cellule?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selection, isEditing])

  const onSelect = useCallback((position: PositionCellule) => {
    setSelection(position)
    setIsEditing(false)
  }, [])
  const onEdit = useCallback((position: PositionCellule) => {
    setSelection(position)
    setIsEditing(true)
  }, [])
  const onCloseEditor = useCallback(() => setIsEditing(false), [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return
    const delta = DELTA_BY_KEY[event.key]
    if (delta) {
      event.preventDefault()
      const next = movePosition({
        position: selection,
        delta,
        lignes: visibles,
        nombreColonnes: colonnes.length,
      })
      setSelection(next)
      document.getElementById(cellDomId(next))?.focus()
      return
    }
    const opensEditor = event.key === 'Enter' || event.key === 'F2'
    if (opensEditor && edition) {
      event.preventDefault()
      setIsEditing(true)
    }
  }

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

      <div
        role="group"
        aria-label="Valeurs à importer"
        onKeyDown={onKeyDown}
        className="min-h-0 flex-1 overflow-auto rounded-b-lg border border-border-strong bg-surface-muted"
      >
        <table className="w-full table-fixed border-separate border-spacing-0 text-[13px]">
          <colgroup>
            <col className="w-12" />
            {colonnes.map((colonne, index) => (
              <col key={index} className={COLUMN_WIDTH[colonne.type]} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-10">
              <th
                scope="col"
                className="sticky top-0 z-[2] border-b border-r border-border-strong bg-surface-muted"
              >
                <span className="sr-only">Ligne</span>
              </th>
              {colonnes.map((colonne, index) => (
                <ColonneEntete key={index} colonne={colonne} />
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((ligne) => {
              const isSelectedLigne = ligne.index === selection.ligne
              return (
                <GrilleLigne
                  key={ligne.index}
                  ligne={ligne}
                  selectedColonne={isSelectedLigne ? selection.colonne : null}
                  editor={isSelectedLigne ? editor : null}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onCloseEditor={onCloseEditor}
                />
              )
            })}
          </tbody>
        </table>
        {visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            Aucune ligne à corriger : toutes les valeurs sont prêtes.
          </p>
        ) : null}
      </div>
    </div>
  )
}
