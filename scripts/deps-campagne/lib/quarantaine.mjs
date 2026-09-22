/**
 * Vérification des exclusions de quarantaine (`minimumReleaseAgeExclude`).
 *
 * Une exclusion est un trou volontaire dans la mitigation supply-chain : elle autorise
 * l'installation d'une version publiée il y a moins de `minimumReleaseAge`. Elle est donc
 * censée être temporaire, et la règle n°2 de DEPENDENCIES.md impose une condition de sortie.
 *
 * Ce module sépare deux questions que les campagnes précédentes confondaient :
 *
 * - l'échéance ÉCRITE dans le commentaire est une estimation humaine. Elle dit quand on
 *   pensait pouvoir retirer l'exclusion ;
 * - la condition RÉELLE est que la version verrouillée ait franchi la quarantaine. C'est
 *   la date de publication au registre qui en décide, pas le commentaire.
 *
 * Une exclusion dont l'échéance est passée mais dont la version est encore fraîche n'est
 * pas retirable : la retirer rouvrirait une fenêtre où une re-résolution ne trouverait
 * aucune version mûre. C'est exactement le piège documenté pour `deepmerge-ts`.
 */

/** Valeur de `minimumReleaseAge` déclarée dans pnpm-workspace.yaml, en minutes. */
export function lireMinimumReleaseAge(texteYaml) {
  const trouve = /^minimumReleaseAge\s*:\s*(\d+)/m.exec(texteYaml)
  return trouve ? Number(trouve[1]) : 0
}

/**
 * Versions d'un paquet présentes dans le lockfile.
 *
 * Les clés scopées y sont quotées ("'@auth/core@0.41.3':") et les autres non : sans ce
 * guillemet optionnel, tous les paquets scopés rendaient silencieusement zéro version,
 * donc zéro vérification.
 *
 * Un motif glob ("@next/*") ne désigne pas un paquet unique : on rend une liste vide
 * plutôt que d'inventer une résolution.
 */
export function versionsVerrouillees(paquet, lockfile) {
  if (paquet.includes('*')) return []
  const echappe = paquet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const motif = new RegExp(`^ {2}'?${echappe}@([^'(:\\s]+)`, 'gm')
  return [...new Set([...lockfile.matchAll(motif)].map((m) => m[1]))]
}

const MARQUEUR = /^#\s*expire\s*:\s*(\S+)/i

/**
 * Lit les exclusions de `pnpm-workspace.yaml` avec l'échéance déclarée juste au-dessus.
 *
 * On lit le texte plutôt que le YAML parsé parce que l'échéance vit dans un commentaire,
 * que tout parseur jette. Le marqueur `# expire: <date|jamais>` doit précéder l'entrée,
 * éventuellement séparé d'elle par d'autres lignes de commentaire explicatives.
 */
export function lireExclusions(texteYaml) {
  const lignes = texteYaml.split('\n')
  const debut = lignes.findIndex((l) => /^minimumReleaseAgeExclude\s*:/.test(l))
  if (debut === -1) return []

  const exclusions = []
  let expireEnCours = null

  for (const ligne of lignes.slice(debut + 1)) {
    const nu = ligne.trim()
    // Une ligne non indentée et non vide ferme le bloc : on est passé à une autre clé.
    if (nu !== '' && !/^\s/.test(ligne)) break

    const marqueur = MARQUEUR.exec(nu)
    if (marqueur) {
      expireEnCours = marqueur[1]
      continue
    }
    if (nu.startsWith('#') || nu === '') continue

    const entree = /^-\s*(.+?)\s*$/.exec(nu)
    if (!entree) continue

    exclusions.push({
      paquet: entree[1].replace(/^["']|["']$/g, ''),
      expire: expireEnCours,
    })
    // L'échéance ne vaut que pour l'entrée qui la suit immédiatement, sauf si plusieurs
    // entrées se partagent le même commentaire — auquel cas elles se suivent sans
    // marqueur intermédiaire et héritent donc de la même valeur.
  }

  return exclusions
}

const JOUR_MS = 86_400_000

/**
 * Verdict sur une exclusion.
 *
 * `publieeLe` est la date de publication de la version verrouillée (null si inconnue, par
 * exemple pour un motif glob comme "@next/*" qui ne désigne pas un paquet unique).
 */
export function verdictQuarantaine({
  paquet,
  expire,
  publieeLe,
  aujourdhui,
  minimumReleaseAgeMinutes,
}) {
  if (expire === null) {
    return {
      paquet,
      statut: 'sans-echeance',
      message:
        "aucune échéance déclarée — viole la règle n°2, aucun banc d'essai ne la cochera jamais",
    }
  }

  if (/^jamais$/i.test(expire)) {
    return { paquet, statut: 'permanente', message: 'politique permanente, ne pas y toucher' }
  }

  const echeance = new Date(`${expire}T00:00:00Z`)
  if (Number.isNaN(echeance.getTime())) {
    return { paquet, statut: 'echeance-illisible', message: `échéance illisible : ${expire}` }
  }

  const retardJours = Math.floor((aujourdhui - echeance) / JOUR_MS)

  if (publieeLe === null) {
    return retardJours >= 0
      ? {
          paquet,
          statut: 'echue-non-verifiable',
          retardJours,
          message: `échéance dépassée de ${retardJours} j, version publiée inconnue — à vérifier`,
        }
      : { paquet, statut: 'en-cours', resteJours: -retardJours, message: `échéance dans ${-retardJours} j` }
  }

  const ageMinutes = Math.floor((aujourdhui - publieeLe) / 60_000)
  const mure = ageMinutes >= minimumReleaseAgeMinutes
  const ageJours = Math.floor(ageMinutes / 1440)

  if (retardJours < 0) {
    return { paquet, statut: 'en-cours', resteJours: -retardJours, ageJours,
             message: `échéance dans ${-retardJours} j` }
  }

  return mure
    ? {
        paquet,
        statut: 'retirable',
        retardJours,
        ageJours,
        message:
          `échéance dépassée de ${retardJours} j et la version verrouillée a ${ageJours} j : retirable`,
      }
    : {
        paquet,
        statut: 'echue-mais-prematuree',
        retardJours,
        ageJours,
        message:
          `échéance dépassée de ${retardJours} j MAIS la version verrouillée n'a que ` +
          `${ageJours} j : la retirer rouvrirait une fenêtre de re-résolution sans version mûre`,
      }
}

/** Les statuts qui doivent faire échouer la vérification. */
export const STATUTS_EN_DEFAUT = [
  'sans-echeance',
  'echeance-illisible',
  'retirable',
  'echue-non-verifiable',
]
