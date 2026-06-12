import type { KeyboardEvent } from 'react'

/**
 * Props pour rendre une ligne (`<tr>`) cliquable et activable au clavier.
 * Un `<tr>` n'est ni focusable ni activable nativement : on ajoute `role`,
 * `tabIndex` et la gestion de Enter/Espace pour l'accessibilité.
 */
export const clickableRowProps = (onActivate: () => void) => ({
  role: 'button',
  tabIndex: 0,
  className: 'cursor-pointer',
  onClick: onActivate,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate()
    }
  },
})
