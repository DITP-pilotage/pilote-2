// Les identifiants de commande sont structurés par convention :
// `indicateur:<id>`, `collection:<id>`, `nav:<page>`, `centre-aide:<id>`,
// `recent:<type>:<id>`, et pour les sous-actions `<type>:<id>:<action>`.
// On en dérive les dimensions analytics plutôt que d'élargir le type Command,
// pour que chaque source de commandes reste ignorante de la mesure.

export type CommandTargetType = 'indicateur' | 'collection' | 'article' | 'page'

export const targetTypeFromCommandId = (id: string): CommandTargetType => {
  const segments = id.split(':')
  const head = segments[0] ?? ''
  const cible = head === 'recent' ? (segments[1] ?? '') : head

  if (cible === 'indicateur') return 'indicateur'
  if (cible === 'collection') return 'collection'
  if (cible === 'nav') return 'page'
  return 'article'
}

export const actionTypeFromActionId = (id: string): string => id.split(':')[2] ?? 'inconnue'
