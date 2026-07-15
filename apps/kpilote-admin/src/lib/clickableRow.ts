import type { KeyboardEvent, MouseEvent } from 'react'

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

/**
 * Props à poser sur une cellule contenant un contrôle interactif (bouton,
 * select…) à l'intérieur d'une ligne rendue cliquable par `clickableRowProps`.
 * Empêche le clic ET l'activation clavier (Enter/Espace) de remonter au `<tr>`
 * et de déclencher la navigation à la place de l'action du contrôle.
 */
export const stopRowActivation = {
  onClick: (event: MouseEvent) => event.stopPropagation(),
  onKeyDown: (event: KeyboardEvent) => event.stopPropagation(),
}
