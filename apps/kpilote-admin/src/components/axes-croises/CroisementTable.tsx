import { useMemo, useState } from 'react'

import { CroisementControls } from '@/components/axes-croises/CroisementControls'
import { CroisementFormulaBar } from '@/components/axes-croises/CroisementFormulaBar'
import { CroisementGrid } from '@/components/axes-croises/CroisementGrid'
import { CroisementWarnings } from '@/components/axes-croises/CroisementWarnings'
import { type ArbreNode, initialCollapsed, TOUS_ID, toggleInSet } from '@/lib/axeArbre'
import {
  type AxeCroise,
  buildCroisement,
  buildSampleCroise,
  type CelluleIds,
  countCombinaisons,
  type Layout,
} from '@/lib/axesCroises'
import { firstFeuilleOf, referenceOf, rowsOf, warningsOf } from '@/lib/croisementTable'

const AUTO_COLLAPSE_AT = 40

export function CroisementTable({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  const [seed, setSeed] = useState(1)
  const [saisies, setSaisies] = useState(() => buildSampleCroise({ axes }))
  const [layout, setLayout] = useState<Layout>({ rows: 0, columns: axes.length > 1 ? 1 : null })
  const [collapsedByAxe, setCollapsedByAxe] = useState<Record<string, ReadonlySet<string>>>(() =>
    Object.fromEntries(
      axes.map((axe) => [
        axe.id,
        initialCollapsed({ arbre: axe.arbre, threshold: AUTO_COLLAPSE_AT }),
      ]),
    ),
  )
  // Un axe fixé part sur sa première feuille : les cases feuille × feuille sont saisissables.
  const [fixedIds, setFixedIds] = useState<ReadonlyArray<string>>(() =>
    axes.map((axe) => firstFeuilleOf(axe.arbre) ?? TOUS_ID),
  )
  const [active, setActive] = useState<CelluleIds | null>(null)

  const resolve = useMemo(() => buildCroisement({ axes, saisies }), [axes, saisies])
  const rowsAxe = axes[layout.rows]
  if (!rowsAxe) {
    return <p className="p-6 text-sm text-text-muted">Déclarez au moins un axe.</p>
  }

  const columnsAxe = layout.columns === null ? undefined : axes[layout.columns]
  const collapsedOf = (axe: AxeCroise): ReadonlySet<string> =>
    collapsedByAxe[axe.id] ?? new Set<string>()
  const randomize = (full: boolean) => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    setSaisies(buildSampleCroise({ axes, seed: nextSeed, full }))
  }
  const columns: ReadonlyArray<ArbreNode | undefined> = columnsAxe
    ? rowsOf({ arbre: columnsAxe.arbre, collapsed: collapsedOf(columnsAxe) })
    : [undefined]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CroisementControls
        axes={axes}
        layout={layout}
        fixedIds={fixedIds}
        hasSaisissable={countCombinaisons(axes) > 0}
        onLayoutChange={(next) => {
          setLayout(next)
          setActive(null)
        }}
        onFixedChange={({ index, id }) => {
          setActive(null)
          setFixedIds((current) =>
            current.map((fixedId, position) => (position === index ? id : fixedId)),
          )
        }}
        onRandomize={randomize}
        onClear={() => setSaisies({})}
      />
      <CroisementWarnings warnings={warningsOf(axes)} />
      <CroisementFormulaBar
        axes={axes}
        reference={active ? referenceOf({ axes, ids: active }) : 'Aucune cellule'}
        cellule={active ? resolve(active) : null}
        resolve={resolve}
      />
      <CroisementGrid
        axes={axes}
        layout={layout}
        fixedIds={fixedIds}
        rows={rowsOf({ arbre: rowsAxe.arbre, collapsed: collapsedOf(rowsAxe) })}
        columns={columns}
        saisies={saisies}
        resolve={resolve}
        active={active}
        isCollapsed={({ axe, id }) => collapsedOf(axe).has(id)}
        onToggle={({ axe, id }) =>
          setCollapsedByAxe((current) => ({
            ...current,
            [axe.id]: toggleInSet({ set: current[axe.id] ?? new Set(), id }),
          }))
        }
        onActivate={setActive}
        onSaisie={({ key, value }) => setSaisies((current) => ({ ...current, [key]: value }))}
      />
      <p className="m-0 border-t border-border px-6 py-2 text-xs text-text-muted">
        <b>Case blanche</b> : saisie (une feuille sur chaque axe). <b>Case teintée</b> : calculée,
        plus foncée pour « Tous ». Une case blanche vide (·) est une combinaison jamais saisie :
        elle sort du calcul (ni 0, ni manquante). Avec une moyenne, ces trous font dépendre « Tous »
        de l’ordre des axes : changez l’ordre dans le formulaire pour le voir.
      </p>
    </div>
  )
}
