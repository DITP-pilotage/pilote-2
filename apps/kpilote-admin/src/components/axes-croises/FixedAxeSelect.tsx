import { useId } from 'react'

import { Field } from '@pilote/kpilote-ui/Field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
import { depthFirst, fonctionLabel, pluralize, TOUS_ID } from '@/lib/axeArbre'
import { type AxeCroise } from '@/lib/axesCroises'
import { clsxm } from '@/lib/clsxm'

const effectOf = ({ axe, id }: { axe: AxeCroise; id: string }): string => {
  const childCount = axe.arbre.get(id)?.children.length ?? 0
  if (childCount === 0) return 'Une feuille : les cases du tableau deviennent saisissables.'
  const modalites = pluralize({ count: childCount, word: 'modalité' })
  return `Chaque case fait la ${fonctionLabel(axe.fonction)} de ses ${modalites}.`
}

// Un axe ni en lignes ni en colonnes : toutes les cases du tableau partagent sa modalité.
export function FixedAxeSelect({
  axe,
  index,
  value,
  onChange,
}: {
  axe: AxeCroise
  index: number
  value: string
  onChange: (id: string) => void
}) {
  const labelId = useId()
  const options = depthFirst({ arbre: axe.arbre, id: TOUS_ID, isOpen: () => true })
  return (
    <div className="flex w-72 flex-col gap-1">
      <Field label={`Fixé · Axe ${index + 1} · ${axe.nom}`} labelId={labelId}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-labelledby={labelId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Comme ModaliteSelect (webapp) : le retrait est posé sur la ligne, pas sur son
                texte, que Radix recopie dans le bouton. */}
            {options.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className={clsxm(option.kind !== 'feuille' && 'font-semibold')}
                style={{ paddingLeft: `${0.625 + option.niveau * 0.875}rem` }}
              >
                {option.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <span className="text-[11px] text-text-subtle">{effectOf({ axe, id: value })}</span>
    </div>
  )
}
