import semver from 'semver'

/**
 * Extrait le nom du paquet d'une clé d'override pnpm.
 * Les clés peuvent embarquer un sélecteur de version : "uuid@>=11.0.0 <11.1.1" -> "uuid".
 * Le @ initial d'un scope ne compte pas comme séparateur.
 */
export function nomPaquetDepuisCle(cle) {
  const scope = cle.startsWith('@')
  const reste = scope ? cle.slice(1) : cle
  const separateur = reste.indexOf('@')
  if (separateur === -1) return cle
  return (scope ? '@' : '') + reste.slice(0, separateur)
}

/**
 * Extrait le sélecteur de version d'une clé d'override, ou '*' s'il n'y en a pas.
 * "uuid@>=11.0.0 <11.1.1" -> ">=11.0.0 <11.1.1" ; "hono" -> "*".
 *
 * Le sélecteur dit QUELLES versions l'override réécrit. Sans lui, on compare des versions
 * que l'override ne toucherait jamais et on conclut n'importe quoi.
 */
export function selecteurDepuisCle(cle) {
  const scope = cle.startsWith('@')
  const reste = scope ? cle.slice(1) : cle
  const separateur = reste.indexOf('@')
  if (separateur === -1) return '*'
  return reste.slice(separateur + 1)
}

const TYPES_DEPS = ['dependencies', 'devDependencies', 'optionalDependencies']

/**
 * Extrait toutes les versions d'un paquet depuis la sortie de
 * `pnpm why <pkg> -r --json --depth Infinity`.
 *
 * La sortie est un tableau d'entrées workspace portant chacune un arbre imbriqué ; le
 * paquet cherché y apparaît à des profondeurs variables et souvent plusieurs fois. La
 * première entrée est la racine du monorepo et n'a pas d'arbre du tout.
 */
export function versionsResoluesDepuisWhy(whyJson, nom) {
  const versions = new Set()

  const explorer = (noeud) => {
    for (const type of TYPES_DEPS) {
      const enfants = noeud[type]
      if (!enfants) continue
      for (const [cle, enfant] of Object.entries(enfants)) {
        if (cle === nom && enfant.version) versions.add(enfant.version)
        explorer(enfant)
      }
    }
  }

  for (const entree of whyJson) explorer(entree)
  return [...versions]
}

/**
 * Un override est PORTEUR si, sans lui, au moins une version résolue tombe hors de son range.
 * Il est INERTE si tout se résout déjà dans le range — il ne sert alors plus à rien.
 *
 * Marche pour les planchers (">=X", le cas des 8 overrides CVE) comme pour les plafonds
 * ("<X", le cas de terser), parce que semver.satisfies ne présume pas du sens du range.
 */
export function verdictOverride({ cle, range, versionsResolues }) {
  const nom = nomPaquetDepuisCle(cle)
  const selecteur = selecteurDepuisCle(cle)
  const base = { cle, nom, range, selecteur, versionsResolues }

  if (versionsResolues.length === 0) {
    return {
      ...base,
      porteur: false,
      preuve: `${nom} est absent de l'arbre de dépendances sans l'override — plus rien ne le tire`,
    }
  }

  // L'override ne réécrit QUE les versions attrapées par le sélecteur de sa clé.
  // Juger les autres reviendrait à leur appliquer une règle qui ne les concerne pas.
  const cibles = versionsResolues.filter((version) => semver.satisfies(version, selecteur))

  if (cibles.length === 0) {
    return {
      ...base,
      porteur: false,
      preuve: `sans l'override, ${nom} se résout en ${versionsResolues.join(', ')} — aucune version ne tombe dans le sélecteur "${selecteur}", l'override ne s'appliquerait jamais`,
    }
  }

  const horsRange = cibles.filter((version) => !semver.satisfies(version, range))

  return {
    ...base,
    porteur: horsRange.length > 0,
    preuve:
      horsRange.length > 0
        ? `sans l'override, ${nom} se résout en ${horsRange.join(', ')} — hors de "${range}"`
        : `sans l'override, ${nom} se résout en ${cibles.join(', ')} — déjà conforme à "${range}"`,
  }
}
