import semver from 'semver'

/**
 * Découpe une clé "parent>enfant" : pnpm ne réécrit alors l'enfant que sous ce parent.
 *
 * Le séparateur se reconnaît à ce qui le suit : un nom de paquet. Le '>' d'un range
 * (">=2", ">2", "> 2") est suivi de '=', d'un chiffre ou d'un espace. Constaté le
 * 2026-10-29 : sans ce découpage, "evalite>fastify" était cherché tel quel dans l'arbre
 * et déclaré absent, alors que pilote-ppg tire bien evalite > fastify.
 */
function decomposerCle(cle) {
  const separateurs = [...cle.matchAll(/>(?=[@a-z_])/gi)]
  if (separateurs.length === 0) return { parent: null, cible: cle }
  const index = separateurs.at(-1).index
  return { parent: cle.slice(0, index), cible: cle.slice(index + 1) }
}

/** Le @ initial d'un scope ne compte pas comme séparateur de version. */
function separerNomEtSelecteur(cle) {
  const scope = cle.startsWith('@')
  const reste = scope ? cle.slice(1) : cle
  const separateur = reste.indexOf('@')
  if (separateur === -1) return { nom: cle, selecteur: '*' }
  return {
    nom: (scope ? '@' : '') + reste.slice(0, separateur),
    selecteur: reste.slice(separateur + 1),
  }
}

/**
 * Extrait le nom du paquet réécrit par une clé d'override pnpm.
 * "uuid@>=11.0.0 <11.1.1" -> "uuid" ; "evalite>@fastify/static" -> "@fastify/static".
 */
export function nomPaquetDepuisCle(cle) {
  return separerNomEtSelecteur(decomposerCle(cle).cible).nom
}

/**
 * Extrait le sélecteur de version d'une clé d'override, ou '*' s'il n'y en a pas.
 * "uuid@>=11.0.0 <11.1.1" -> ">=11.0.0 <11.1.1" ; "hono" -> "*".
 *
 * Le sélecteur dit QUELLES versions l'override réécrit. Sans lui, on compare des versions
 * que l'override ne toucherait jamais et on conclut n'importe quoi.
 */
export function selecteurDepuisCle(cle) {
  return separerNomEtSelecteur(decomposerCle(cle).cible).selecteur
}

/** Nom du parent d'une clé "parent>enfant", ou null pour un override global. */
export function parentDepuisCle(cle) {
  const { parent } = decomposerCle(cle)
  return parent === null ? null : separerNomEtSelecteur(parent).nom
}

const TYPES_DEPS = ['dependencies', 'devDependencies', 'optionalDependencies']

/**
 * Extrait toutes les versions d'un paquet depuis la sortie de
 * `pnpm why <pkg> -r --json --depth Infinity`.
 *
 * La sortie est un tableau d'entrées workspace portant chacune un arbre imbriqué ; le
 * paquet cherché y apparaît à des profondeurs variables et souvent plusieurs fois. La
 * première entrée est la racine du monorepo et n'a pas d'arbre du tout.
 *
 * Avec `parent`, seules comptent les instances tirées directement par ce parent : ce sont
 * les seules qu'un override "parent>enfant" réécrit.
 */
export function versionsResoluesDepuisWhy(whyJson, nom, parent = null) {
  const versions = new Set()

  const explorer = (noeud, nomNoeud) => {
    for (const type of TYPES_DEPS) {
      const enfants = noeud[type]
      if (!enfants) continue
      for (const [cle, enfant] of Object.entries(enfants)) {
        if (cle === nom && enfant.version && (parent === null || nomNoeud === parent)) {
          versions.add(enfant.version)
        }
        explorer(enfant, cle)
      }
    }
  }

  for (const entree of whyJson) explorer(entree, entree.name)
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
  const parent = parentDepuisCle(cle)
  const selecteur = selecteurDepuisCle(cle)
  const base = { cle, nom, parent, range, selecteur, versionsResolues }
  const libelle = parent === null ? nom : `${nom} (sous ${parent})`

  if (versionsResolues.length === 0) {
    return {
      ...base,
      porteur: false,
      preuve: `${libelle} est absent de l'arbre de dépendances sans l'override — plus rien ne le tire`,
    }
  }

  // L'override ne réécrit QUE les versions attrapées par le sélecteur de sa clé.
  // Juger les autres reviendrait à leur appliquer une règle qui ne les concerne pas.
  const cibles = versionsResolues.filter((version) => semver.satisfies(version, selecteur))

  if (cibles.length === 0) {
    return {
      ...base,
      porteur: false,
      preuve: `sans l'override, ${libelle} se résout en ${versionsResolues.join(', ')} — aucune version ne tombe dans le sélecteur "${selecteur}", l'override ne s'appliquerait jamais`,
    }
  }

  const horsRange = cibles.filter((version) => !semver.satisfies(version, range))

  return {
    ...base,
    porteur: horsRange.length > 0,
    preuve:
      horsRange.length > 0
        ? `sans l'override, ${libelle} se résout en ${horsRange.join(', ')} — hors de "${range}"`
        : `sans l'override, ${libelle} se résout en ${cibles.join(', ')} — déjà conforme à "${range}"`,
  }
}
