import { useState } from 'react'

import { PANEL_INPUT } from '@/components/axe-graphe/panelInput'
import { Button } from '@pilote/kpilote-ui/Button'

export function RenameForm({
  initial,
  disabled,
  onSave,
}: {
  initial: string
  disabled: boolean
  onSave: (nom: string) => void
}) {
  const [nom, setNom] = useState(initial)
  const isChanged = nom.trim() !== '' && nom.trim() !== initial
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(nom.trim())
      }}
    >
      <input
        value={nom}
        disabled={disabled}
        onChange={(event) => setNom(event.target.value)}
        aria-label="Nom"
        className={PANEL_INPUT}
      />
      <Button type="submit" size="sm" disabled={!isChanged || disabled}>
        Renommer
      </Button>
    </form>
  )
}
