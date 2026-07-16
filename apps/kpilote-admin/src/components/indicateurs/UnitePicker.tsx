import { UNITES_INDICATEUR, UNITES_INDICATEUR_CONFIG } from '@pilote/kpilote-shared/indicateur'

import { Field } from '@/components/ui/Field'
import { Picker } from '@/components/ui/Picker'

type UniteItem = { code: string; libelle: string }

// « Aucune » (code vide) en premier pour permettre de revenir à l'absence d'unité.
const UNITE_ITEMS: UniteItem[] = [
  { code: '', libelle: 'Aucune' },
  ...UNITES_INDICATEUR.map((code) => ({ code, libelle: UNITES_INDICATEUR_CONFIG[code].libelle })),
]

// Champ contrôlé (value/onChange) : s'utilise dans un <Controller> RHF.
export function UnitePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  return (
    <Field label={label}>
      <Picker
        items={UNITE_ITEMS}
        value={value}
        onSelect={(item) => onChange(item.code)}
        getKey={(item) => item.code}
        getSearchText={(item) => item.libelle}
        renderItem={(item) => <span className="truncate text-sm text-text">{item.libelle}</span>}
        triggerLabel="Aucune"
        disabled={disabled ?? false}
      />
    </Field>
  )
}
