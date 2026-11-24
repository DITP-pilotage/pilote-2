import { depthFirst } from '@pilote/kpilote-shared/modaliteTree'
import { Field } from '@pilote/kpilote-ui/Field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
import { useId } from 'react'

import { type AxeTableau } from '@/lib/axes/tableauValeurs'
import { clsxm } from '@/lib/clsxm'

// Un axe ni en lignes ni en colonnes : toutes les cases du tableau partagent sa modalité.
export function FixedAxeSelect({
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
