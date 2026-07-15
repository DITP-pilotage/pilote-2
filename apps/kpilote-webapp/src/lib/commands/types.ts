import type { LucideIcon } from 'lucide-react'

import { normaliserTexte } from '@/lib/texte'

/**
 * Regroupement d'une commande dans la palette. Volontairement extensible :
 * les itérations futures ajouteront `'dossiers'`, `'actions'`, etc.
 */
export type CommandGroup = 'navigation' | 'recents' | 'indicateurs' | 'dossiers'

/**
 * Sous-action accessible via `Tab` sur une commande actionnable (ex: sur un
 * indicateur : « Voir les commentaires », « Voir les métadonnées »…).
 *
 * Volontairement découplée de la navigation : `run()` peut aussi bien naviguer
 * vers un onglet que déclencher demain un import de données ou l'ouverture d'une
 * modale. Chaque domaine fournit ses actions via un builder dédié.
 */
export type CommandAction = {
  /** Identifiant stable et unique (sert aussi de `value` cmdk). */
  id: string
  /** Libellé principal affiché. */
  label: string
  /** Termes supplémentaires pris en compte par le filtrage. */
  keywords?: string[]
  /** Icône optionnelle affichée à gauche. */
  icon?: LucideIcon
  /** Texte secondaire discret. */
  hint?: string
  /** Effet déclenché à la sélection. */
  run: () => void
}

/**
 * Contrat générique d'une entrée de la palette de commandes (⌘K).
 *
 * Chaque commande a une action primaire (`run`, déclenchée par `Entrée`). Elle
 * peut en plus exposer des sous-actions (`actions`) accessibles via `Tab` : la
 * palette bascule alors sur une page dédiée listant ces actions. Un item est
 * « actionnable » ssi `actions` est présent et non vide.
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
  /** Action primaire déclenchée par `Entrée`. */
  run: () => void
  /** Sous-actions accessibles via `Tab` (page dédiée). Opt-in par commande. */
  actions?: CommandAction[]
}

/**
 * Filtrage client d'une liste de commandes par sous-chaîne (insensible à la casse
 * et aux accents) sur le libellé et les mots-clés.
 */
export function filterCommands(commands: Command[], query: string): Command[] {
  return filterByLabelAndKeywords(commands, query)
}

/**
 * Filtrage client des sous-actions d'une page (`Tab`), même contrat que
 * {@link filterCommands} : sous-chaîne insensible à la casse et aux accents sur
 * libellé + mots-clés.
 */
export function filterActions(actions: CommandAction[], query: string): CommandAction[] {
  return filterByLabelAndKeywords(actions, query)
}

function filterByLabelAndKeywords<T extends { label: string; keywords?: string[] }>(
  items: T[],
  query: string,
): T[] {
  const needle = normaliserTexte(query.trim())
  if (!needle) return items
  return items.filter((item) => {
    const haystack = normaliserTexte([item.label, ...(item.keywords ?? [])].join(' '))
    return haystack.includes(needle)
  })
}
