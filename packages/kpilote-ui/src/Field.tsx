import type { ReactNode } from 'react'

import { clsxm } from './clsxm'

export type FieldProps = {
  label: string
  required?: boolean | undefined
  hint?: string | undefined
  // Aide affichée sous le contrôle. `descriptionId` est posé dessus, pour que le
  // contrôle la référence via `aria-describedby` et qu'elle soit annoncée avec lui.
  description?: string | undefined
  descriptionId?: string | undefined
  error?: string | undefined
  hideLabel?: boolean | undefined
  // Id posé sur le `<label>`, pour associer un contrôle custom via
  // `aria-labelledby` (ex. un radiogroup qui n'a pas de `<input>` natif).
  labelId?: string | undefined
  // Id du contrôle natif associé (`<label for>`), pour les champs input /
  // select / textarea. Fourni par FieldInput & co via `useId`.
  htmlFor?: string | undefined
  children: ReactNode
}

// Enveloppe partagée d'un champ de formulaire : label (avec astérisque « requis »
// et indice optionnels) + contrôle + description et message d'erreur optionnels. Réutilisée par FieldInput,
// FieldSelect, FieldTextarea et les contrôles custom. Le label reste toujours dans
// le DOM ; `hideLabel` le masque visuellement (`sr-only`) sans le retirer aux
// lecteurs d'écran — utile pour les champs en grille où le libellé est implicite.
export function Field({
  label,
  required,
  hint,
  description,
  descriptionId,
  error,
  hideLabel,
  labelId,
  htmlFor,
  children,
}: FieldProps) {
  return (
    <div>
      <label
        id={labelId}
        htmlFor={htmlFor}
        className={clsxm('mb-1.5 block text-xs font-semibold', hideLabel && 'sr-only')}
      >
        {label}
        {required ? <span className="text-red-marianne"> *</span> : null}
        {hint ? <span className="ml-2 text-xs font-normal text-text-muted">{hint}</span> : null}
      </label>
      {children}
      {description ? (
        <p id={descriptionId} className="mt-1.5 text-xs leading-normal text-text-muted">
          {description}
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-marianne">{error}</p> : null}
    </div>
  )
}
