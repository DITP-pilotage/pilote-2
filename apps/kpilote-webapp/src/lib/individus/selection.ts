// Sérialisation de la sélection d'individu par ensemble dans l'URL.
// Format : `REF-FR:DEPT-84,REF-BV:BV-12` — clé = référentiel racine (publicId),
// valeur = individu (publicId). Source de vérité partageable, transportée d'une
// page à l'autre pour persister le choix.

export const parseIndividusParam = (raw?: string): Map<string, string> => {
  const map = new Map<string, string>()
  if (!raw) return map
  for (const pair of raw.split(',')) {
    const [root, individu] = pair.split(':')
    if (root && individu) map.set(root, individu)
  }
  return map
}

export const serializeIndividusParam = (
  map: ReadonlyMap<string, string>,
): string | undefined => {
  if (map.size === 0) return undefined
  return [...map.entries()].map(([root, individu]) => `${root}:${individu}`).join(',')
}
