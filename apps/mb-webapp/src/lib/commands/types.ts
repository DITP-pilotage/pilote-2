import type { LucideIcon } from 'lucide-react'

/**
 * Regroupement d'une commande dans la palette. Volontairement extensible :
 * les itérations futures ajouteront `'paniers'`, `'actions'`, etc.
 */
export type CommandGroup = 'navigation' | 'indicateurs'

/**
 * Contrat générique d'une entrée de la palette de commandes (⌘K).
 *
 * Aujourd'hui chaque commande est une navigation, mais le modèle est pensé pour
 * accueillir demain des sous-actions (import de données d'un indicateur, panier
 * pré-filtré…) : il suffira d'ajouter une commande avec son propre `run()`.
 */
export type Command = {
  /** Identifiant stable et unique (sert aussi de `value` cmdk). */
  id: string
  /** Libellé principal affiché. */
  label: string
  /** Regroupement dans la liste. */
  group: CommandGroup
  /** Termes supplémentaires pris en compte par le filtrage (ex: `['IND-42']`). */
  keywords?: string[]
  /** Icône optionnelle affichée à gauche. */
  icon?: LucideIcon
  /** Texte secondaire discret (ex: le publicId affiché en mono). */
  hint?: string
  /** Effet déclenché à la sélection (navigation aujourd'hui). */
  run: () => void
}

/**
 * Filtrage client d'une liste de commandes par sous-chaîne (insensible à la casse)
 * sur le libellé et les mots-clés. Utilisé pour les commandes statiques, dont le
 * filtrage n'est pas délégué au serveur.
 */
export function filterCommands(commands: Command[], query: string): Command[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return commands
  return commands.filter((command) => {
    const haystack = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase()
    return haystack.includes(needle)
  })
}
