import semver from 'semver'

/**
 * Paquets qui doivent impérativement bouger d'un seul tenant.
 * - @tiptap/* : versions désalignées => plusieurs instances de @tiptap/core au runtime => éditeur cassé.
 * - eslint / @eslint/js : le plugin suit le major du core.
 */
const GROUPES_COUPLES = [
  { nom: 'tiptap', concerne: (name) => name.startsWith('@tiptap/') },
  {
    nom: 'eslint',
    concerne: (name) => name === 'eslint' || name === '@eslint/js',
  },
]

/**
 * Transforme la sortie de `pnpm outdated --format json` en liste plate.
 * Ne JAMAIS lire `info.wanted` : il rapporte `current` même quand le range autorise mieux.
 */
export function parseOutdated(raw) {
  return Object.entries(raw)
    .map(([name, info]) => {
      const current = semver.coerce(info.current)
      const latest = semver.coerce(info.latest)
      if (!current || !latest) return null
      return {
        name,
        current: info.current,
        latest: info.latest,
        isMajor: semver.major(latest) !== semver.major(current),
        // Indispensable : `pnpm add` écrit dans `dependencies` par défaut. Sans savoir
        // qu'un paquet est une devDependency, on le déplacerait silencieusement de section.
        estDevDependency: info.dependencyType === 'devDependencies',
        dependents: (info.dependentPackages ?? []).map((p) => p.name),
      }
    })
    .filter((dep) => dep !== null)
}

/** Regroupe les paquets couplés ; les autres forment un groupe d'un seul élément. */
export function grouperCouples(deps) {
  const groupes = new Map()

  for (const dep of deps) {
    const couple = GROUPES_COUPLES.find((g) => g.concerne(dep.name))
    const nom = couple ? couple.nom : dep.name
    if (!groupes.has(nom)) groupes.set(nom, { nom, deps: [] })
    groupes.get(nom).deps.push(dep)
  }

  return [...groupes.values()]
}
