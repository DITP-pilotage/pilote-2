/**
 * Dépendances déclarées hors du registre npm : URL de tarball, dépôt git, chemin local.
 *
 * Elles échappent à tout l'outillage de la campagne à la fois : `pnpm outdated` ne voit pas
 * qu'une version plus récente existe en amont, `pnpm audit` n'en dit rien de fiable, et
 * `minimumReleaseAge` ne s'applique pas. Une telle dépendance que personne ne regarde est figée
 * pour toujours sans que rien ne le signale. Le moteur les repère donc toutes, et exige que
 * chacune ait sa ligne dans la section « Dépendances hors registre » de DEPENDENCIES.md.
 */

const PREFIXES_HORS_REGISTRE = [
  'http:',
  'https:',
  'git:',
  'git+',
  'github:',
  'gitlab:',
  'bitbucket:',
  'file:',
  'link:',
]

const CHAMPS_DEPENDANCES = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

const TITRE_SECTION = '## Dépendances hors registre'

/** `workspace:`, `catalog:`, `npm:` et les ranges semver passent par le registre. */
export function isOutsideRegistry(specifier) {
  return PREFIXES_HORS_REGISTRE.some((prefixe) => specifier.startsWith(prefixe))
}

/**
 * @param {{ chemin: string, contenu: Record<string, unknown> }[]} manifestes
 * @returns {{ paquet: string, specifier: string, manifeste: string, champ: string }[]}
 */
export function findOutsideRegistryDeps(manifestes) {
  return manifestes.flatMap(({ chemin, contenu }) => {
    const champs = [
      ...CHAMPS_DEPENDANCES.map((champ) => [champ, contenu[champ]]),
      ['pnpm.overrides', contenu.pnpm?.overrides],
    ]
    return champs.flatMap(([champ, deps]) =>
      Object.entries(deps ?? {})
        .filter(([, specifier]) => typeof specifier === 'string' && isOutsideRegistry(specifier))
        .map(([paquet, specifier]) => ({ paquet, specifier, manifeste: chemin, champ })),
    )
  })
}

/** Paquets listés en première colonne du tableau de la section dédiée de DEPENDENCIES.md. */
export function readDocumentedPackages(markdown) {
  const debut = markdown.indexOf(TITRE_SECTION)
  if (debut === -1) return []
  const suite = markdown.slice(debut + TITRE_SECTION.length)
  const fin = suite.search(/^## /m)
  const section = fin === -1 ? suite : suite.slice(0, fin)
  return [...section.matchAll(/^\|\s*`([^`]+)`/gm)].map(([, paquet]) => paquet)
}

export function getOutsideRegistryVerdicts(trouvees, documentes) {
  const connus = new Set(documentes)
  return trouvees.map((dep) => ({ ...dep, documente: connus.has(dep.paquet) }))
}
