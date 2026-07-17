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
 * Un override est PORTEUR si, sans lui, au moins une version résolue tombe hors de son range.
 * Il est INERTE si tout se résout déjà dans le range — il ne sert alors plus à rien.
 *
 * Marche pour les planchers (">=X", le cas des 8 overrides CVE) comme pour les plafonds
 * ("<X", le cas de terser), parce que semver.satisfies ne présume pas du sens du range.
 */
export function verdictOverride({ cle, range, versionsResolues }) {
  const nom = nomPaquetDepuisCle(cle)

  if (versionsResolues.length === 0) {
    return {
      cle,
      nom,
      range,
      versionsResolues,
      porteur: false,
      preuve: `${nom} est absent de l'arbre de dépendances sans l'override — plus rien ne le tire`,
    }
  }

  const horsRange = versionsResolues.filter((version) => !semver.satisfies(version, range))

  return {
    cle,
    nom,
    range,
    versionsResolues,
    porteur: horsRange.length > 0,
    preuve:
      horsRange.length > 0
        ? `sans l'override, ${nom} se résout en ${horsRange.join(', ')} — hors de "${range}"`
        : `sans l'override, ${nom} se résout en ${versionsResolues.join(', ')} — déjà conforme à "${range}"`,
  }
}
