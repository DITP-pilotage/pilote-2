import { type DeclarationAxeIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { depthFirst, type ModaliteKind, TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import {
  type CelluleValeur,
  type CombinaisonIds,
  combinaisonKey,
  explainCellule,
  resolveCellule,
} from '@pilote/kpilote-shared/valeursCombinaison'
import { Temporal } from '@js-temporal/polyfill'
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'

import { Field } from '@pilote/kpilote-ui/Field'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import { SegmentedControl } from '@pilote/kpilote-ui/SegmentedControl'
import { FormulaBar } from '@pilote/kpilote-ui/FormulaBar'
import {
  type PivotCell,
  type PivotEmphase,
  type PivotHeader,
  PivotTable,
} from '@pilote/kpilote-ui/PivotTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
import { CelluleReference } from '@/components/indicateurs/tableau-valeurs/CelluleReference'
import { ExplicationCellule } from '@/components/indicateurs/tableau-valeurs/ExplicationCellule'
import { VueLignes } from '@/components/indicateurs/tableau-valeurs/VueLignes'
import { buildNomOfIndividu, referenceLinesOf } from '@/lib/axes/explicationCellule'
import { clsxm } from '@/lib/clsxm'
import { formatMonthYearShortFr, formatNumberFr } from '@/lib/format'
import {
  type AxeTableau,
  buildCelluleIds,
  buildTableauValeursContext,
  type Disposition,
  INITIAL_DISPOSITION,
  initialCollapsed,
  type TableauValeursContext,
  toggleIn,
  withColonnes,
  withLignes,
} from '@/lib/axes/tableauValeurs'
import { useAxesWithModalites } from '@/queries/axes'
import { indicateurValeursByCombinaisonQueryOptions } from '@/queries/indicateurs'
import { referentielIndividusQueryOptions } from '@/queries/referentiels'

// Hors du composant : une fonction stable laisse useQueries mémoriser le résultat.
const individusOf = (results: ReadonlyArray<UseQueryResult<ReadonlyArray<IndividuApiModel>>>) =>
  results.flatMap((result) => result.data ?? [])

// Le cube de l'individu affiché, en tableau croisé ou en lignes, en lecture seule. Les axes
// choisis dans les sélecteurs de la page partent fixés sur leur modalité.
export function TableauValeursTab({
  indicateurId,
  individuId,
  referentielIds,
  declarations,
  modalitesFixees,
}: {
  indicateurId: string
  individuId: string
  // Tous les référentiels de l'indicateur : les individus enfants peuvent être dans un autre.
  referentielIds: ReadonlyArray<string>
  declarations: ReadonlyArray<DeclarationAxeIndicateurApiModel>
  // Une entrée par axe déclaré : la modalité choisie, ou `null` pour « Tous ».
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const individus = useQueries({
    queries: referentielIds.map(referentielIndividusQueryOptions),
    combine: individusOf,
  })
  const nomOfIndividu = useMemo(() => buildNomOfIndividu(individus), [individus])
  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[32rem] flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <TableauValeursContent
        indicateurId={indicateurId}
        individuId={individuId}
        declarations={declarations}
        nomOfIndividu={nomOfIndividu}
        modalitesFixees={modalitesFixees}
      />
    </div>
  )
}

function TableauValeursContent({
  indicateurId,
  individuId,
  declarations,
  nomOfIndividu,
  modalitesFixees,
}: {
  indicateurId: string
  individuId: string
  declarations: ReadonlyArray<DeclarationAxeIndicateurApiModel>
  nomOfIndividu: (individuId: string) => string
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const axesWithModalites = useAxesWithModalites(declarations)
  // `useQuery` plutôt que la suspense : un refus de l'API (trop de combinaisons) s'affiche
  // dans l’onglet au lieu de remonter jusqu'à l'erreur de la page.
  const { data, isPending, isError } = useQuery(
    indicateurValeursByCombinaisonQueryOptions({ indicateurId, individuId }),
  )
  const context = useMemo(
    () =>
      data
        ? buildTableauValeursContext({
            axes: axesWithModalites.map((axe, index) => ({
              ...axe,
              fonction: declarations[index]?.fonction ?? 'SUM',
            })),
            items: data.items,
          })
        : null,
    [axesWithModalites, declarations, data],
  )

  if (isError) {
    return (
      <p className="p-6 text-sm text-error">
        Les valeurs n’ont pas pu être chargées : l’indicateur a peut-être trop de combinaisons de
        modalités pour ce tableau.
      </p>
    )
  }
  if (isPending || !context) {
    return <p className="p-6 text-sm text-text-muted">Chargement des valeurs…</p>
  }
  if (context.periodes.length === 0) {
    return <p className="p-6 text-sm text-text-muted">Aucune valeur pour cet individu.</p>
  }
  return (
    <TableauValeurs
      // Changer d'individu ou de modalité dans les sélecteurs repart d'un tableau neuf.
      key={`${individuId}|${modalitesFixees.join(',')}`}
      context={context}
      individuId={individuId}
      nomOfIndividu={nomOfIndividu}
      modalitesFixees={modalitesFixees}
    />
  )
}

const KIND_DOT: Record<ModaliteKind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

const KIND_EMPHASE: Record<ModaliteKind, PivotEmphase> = {
  feuille: 'base',
  parente: 'sous-total',
  tous: 'total',
}

const STATUT_CELL: Record<CelluleValeur['statut'], string> = {
  saisie: 'text-text',
  reportee: 'text-text-subtle italic',
  manquante: 'bg-warning-tinted/60 text-warning',
  absente: 'font-normal text-text-subtle',
  calculee: 'text-text',
}

const PERIODES_VALUE = 'periodes'

type ActiveCellule = { ids: CombinaisonIds; periode: string }

const formatPeriode = (periode: string) => formatMonthYearShortFr(Temporal.PlainDate.from(periode))

type Vue = 'croise' | 'lignes'

const VUE_OPTIONS = [
  { value: 'croise', label: 'Tableau croisé' },
  { value: 'lignes', label: 'Lignes' },
] as const satisfies ReadonlyArray<{ value: Vue; label: string }>

function TableauValeurs({
  context,
  individuId,
  nomOfIndividu,
  modalitesFixees,
}: {
  context: TableauValeursContext
  individuId: string
  nomOfIndividu: (individuId: string) => string
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const { axes, series, periodes, axeIndexByModalite } = context
  const [disposition, setDisposition] = useState<Disposition>(INITIAL_DISPOSITION)
  const [periode, setPeriode] = useState(() => periodes.at(-1) ?? '')
  const [fixees, setFixees] = useState<ReadonlyArray<string>>(() =>
    axes.map((_, index) => modalitesFixees[index] ?? TOUS_ID),
  )
  const [collapsedByAxe, setCollapsedByAxe] = useState<Record<string, ReadonlySet<string>>>(() =>
    Object.fromEntries(axes.map((axe) => [axe.id, initialCollapsed(axe.tree)])),
  )
  const [active, setActive] = useState<ActiveCellule | null>(null)
  const [vue, setVue] = useState<Vue>('croise')
  const individuNom = nomOfIndividu(individuId)
  const individu = useMemo(() => ({ id: individuId, nom: individuNom }), [individuId, individuNom])

  const axeLignes = axes[disposition.lignes]
  const axeColonnes = disposition.colonnes === null ? undefined : axes[disposition.colonnes]
  if (!axeLignes) return null

  const celluleOf = ({ ids, periode: date }: ActiveCellule) =>
    resolveCellule({ valeurs: series.get(combinaisonKey(ids)), periode: date })
  const activeCellule = active ? celluleOf(active) : null
  const explication =
    active && activeCellule
      ? explainCellule({ cellule: activeCellule, ids: active.ids, axeIndexByModalite })
      : null
  const precedents = new Set(
    explication?.kind === 'axe' ? explication.termes.map((terme) => combinaisonKey(terme.ids)) : [],
  )

  const headersOf = (axe: AxeTableau): PivotHeader[] => {
    const collapsed = collapsedByAxe[axe.id] ?? new Set<string>()
    return depthFirst({ tree: axe.tree, isOpen: (id) => !collapsed.has(id) }).map((node) => ({
      id: node.id,
      name: node.nom,
      label: node.nom,
      depth: node.niveau,
      emphase: KIND_EMPHASE[node.kind],
      marker: <span className={clsxm('size-2 shrink-0 rounded-full', KIND_DOT[node.kind])} />,
      toggle:
        node.children.length > 0
          ? {
              isCollapsed: collapsed.has(node.id),
              onToggle: () =>
                setCollapsedByAxe((current) => ({
                  ...current,
                  [axe.id]: toggleIn({ set: current[axe.id] ?? new Set(), id: node.id }),
                })),
            }
          : undefined,
    }))
  }

  const rows = headersOf(axeLignes)
  const columns: PivotHeader[] = axeColonnes
    ? headersOf(axeColonnes).map((header) => ({ ...header, depth: 0 }))
    : periodes.map((date) => ({
        id: date,
        name: formatPeriode(date),
        label: formatPeriode(date),
        highlighted: active?.periode === date,
      }))

  const cellOf = ({ row, column }: { row: PivotHeader; column: PivotHeader }): PivotCell => {
    const ids = buildCelluleIds({
      disposition,
      fixees,
      row: row.id,
      column: axeColonnes ? column.id : null,
    })
    const date = axeColonnes ? periode : column.id
    const cellule = celluleOf({ ids, periode: date })
    const key = combinaisonKey(ids)
    const isActive =
      active !== null && combinaisonKey(active.ids) === key && active.periode === date
    const isPrecedent = active?.periode === date && precedents.has(key)
    return {
      content: <ValeurCellule cellule={cellule} />,
      className: STATUT_CELL[cellule.statut],
      tone: toneOf({ isActive, isPrecedent }),
      label: `${referenceOf({ axes, ids })}, ${formatPeriode(date)}`,
      onActivate: () => setActive({ ids, periode: date }),
    }
  }

  const autresAxes = axes
    .map((axe, index) => ({ axe, index }))
    .filter(({ index }) => index !== disposition.lignes && index !== disposition.colonnes)
  const axeOptions = axes.map((axe, index) => ({
    value: String(index),
    label: `Axe ${index + 1} · ${axe.nom}`,
  }))
  const changeDisposition = (next: Disposition) => {
    setDisposition(next)
    setActive(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <SegmentedControl
          aria-label="Présentation des valeurs"
          value={vue}
          onValueChange={(next) => {
            setVue(next)
            setActive(null)
          }}
          options={VUE_OPTIONS}
        />
        {vue === 'croise' ? (
          <>
            <div className="w-56">
              <FieldSelect
                label="Lignes"
                value={String(disposition.lignes)}
                onValueChange={(value) =>
                  changeDisposition(withLignes({ disposition, index: Number(value) }))
                }
                options={axeOptions}
              />
            </div>
            {axes.length > 1 ? (
              <div className="w-56">
                <FieldSelect
                  label="Colonnes"
                  value={
                    disposition.colonnes === null ? PERIODES_VALUE : String(disposition.colonnes)
                  }
                  onValueChange={(value) =>
                    changeDisposition(
                      withColonnes({
                        disposition,
                        index: value === PERIODES_VALUE ? null : Number(value),
                        axesCount: axes.length,
                      }),
                    )
                  }
                  options={[{ value: PERIODES_VALUE, label: 'Périodes' }, ...axeOptions]}
                />
              </div>
            ) : null}
            {axeColonnes ? (
              <div className="w-44">
                <FieldSelect
                  label="Période"
                  value={periode}
                  onValueChange={(value) => {
                    setPeriode(value)
                    setActive(null)
                  }}
                  options={periodes.toReversed().map((date) => ({
                    value: date,
                    label: formatPeriode(date),
                  }))}
                />
              </div>
            ) : null}
            {autresAxes.map(({ axe, index }) => (
              <FixeeSelect
                key={axe.id}
                axe={axe}
                index={index}
                value={fixees[index] ?? TOUS_ID}
                onChange={(id) => {
                  setActive(null)
                  setFixees((current) =>
                    current.map((fixee, position) => (position === index ? id : fixee)),
                  )
                }}
              />
            ))}
          </>
        ) : null}
      </div>

      <FormulaBar
        reference={
          active ? (
            <CelluleReference
              lines={referenceLinesOf({ axes, ids: active.ids })}
              periode={formatPeriode(active.periode)}
            />
          ) : (
            'Aucune cellule'
          )
        }
      >
        <ExplicationCellule
          axes={axes}
          explication={explication}
          cellule={activeCellule}
          periode={active?.periode ?? null}
          nomOfIndividu={nomOfIndividu}
        />
      </FormulaBar>

      {vue === 'croise' ? (
        <>
          <div className="min-h-0 flex-1 overflow-auto">
            <PivotTable
              corner={`${axeLignes.nom} ↓ · ${axeColonnes ? axeColonnes.nom : 'Périodes'} →`}
              rows={rows}
              columns={columns}
              cellOf={cellOf}
            />
          </div>
          <Legende />
        </>
      ) : (
        <VueLignes context={context} individu={individu} onActivate={setActive} />
      )}
    </div>
  )
}

const toneOf = ({
  isActive,
  isPrecedent,
}: {
  isActive: boolean
  isPrecedent: boolean
}): PivotCell['tone'] => {
  if (isActive) return 'active'
  if (isPrecedent) return 'precedent'
  return undefined
}

function ValeurCellule({ cellule }: { cellule: CelluleValeur }) {
  switch (cellule.statut) {
    case 'absente':
      return <span>·</span>
    case 'manquante':
      return <span>?</span>
    case 'reportee':
      return <span>↳ {formatNumberFr(cellule.value ?? 0)}</span>
    case 'saisie':
      return <span>{formatNumberFr(cellule.value ?? 0)}</span>
    case 'calculee':
      return (
        <>
          {cellule.present < cellule.expected ? (
            <span className="text-[10px] font-normal text-warning-425">
              {cellule.present}/{cellule.expected}
            </span>
          ) : null}
          <span>{formatNumberFr(cellule.value ?? 0)}</span>
        </>
      )
  }
}

const referenceOf = ({ axes, ids }: { axes: ReadonlyArray<AxeTableau>; ids: CombinaisonIds }) =>
  ids
    .map((id, index) => {
      const axe = axes[index]
      const nom = axe?.tree.get(id)?.nom ?? id
      return id === TOUS_ID ? nom : `${axe?.nom ?? ''} : ${nom}`
    })
    .join(' × ')

function FixeeSelect({
  axe,
  index,
  value,
  onChange,
}: {
  axe: AxeTableau
  index: number
  value: string
  onChange: (id: string) => void
}) {
  const labelId = useId()
  return (
    <div className="w-64">
      <Field label={`Fixé · Axe ${index + 1} · ${axe.nom}`} labelId={labelId}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-labelledby={labelId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Comme ModaliteSelect : le retrait est posé sur la ligne, pas sur son texte, que
                Radix recopie dans le bouton. */}
            {depthFirst({ tree: axe.tree }).map((node) => (
              <SelectItem
                key={node.id}
                value={node.id}
                className={clsxm(node.kind !== 'feuille' && 'font-semibold')}
                style={{ paddingLeft: `${0.625 + node.niveau * 0.875}rem` }}
              >
                {node.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

const LEGENDE: ReadonlyArray<{ statut: CelluleValeur['statut']; label: string; exemple: string }> =
  [
    { statut: 'saisie', label: 'Saisie', exemple: '42' },
    { statut: 'reportee', label: 'Reportée', exemple: '↳ 42' },
    { statut: 'manquante', label: 'Pas encore de valeur', exemple: '?' },
    { statut: 'absente', label: 'Jamais saisie', exemple: '·' },
    { statut: 'calculee', label: 'Calculée par l’API', exemple: '84' },
  ]

function Legende() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-2 text-xs text-text-muted">
      {LEGENDE.map(({ statut, label, exemple }) => (
        <span key={statut} className="inline-flex items-center gap-1.5">
          <span
            className={clsxm(
              'inline-flex h-5 min-w-9 items-center justify-end rounded-sm border border-border px-1.5 tabular-nums',
              STATUT_CELL[statut],
              statut === 'calculee' && 'bg-surface-muted font-semibold',
            )}
          >
            {exemple}
          </span>
          {label}
        </span>
      ))}
      <span className="ml-auto">
        Case blanche : une modalité feuille sur chaque axe ; teintée : agrégat, plus foncée pour «
        Tous ». En orange, le nombre d’enfants qui ont une valeur sur le nombre attendu.
      </span>
    </div>
  )
}
