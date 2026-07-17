/**
 * Le report.json est le seul contrat entre le moteur déterministe et le skill.
 * Il reste volontairement compact : le skill lit des verdicts, jamais des logs bruts.
 * Toutes les fonctions sont pures — elles rendent un nouveau rapport, sans muter l'entrée.
 */

export function creerReport({ date, snapshot }) {
  return { date, snapshot, commits: [], overrides: [] }
}

/**
 * Résume la sortie de `pnpm audit --json` : un compte par sévérité et le nombre
 * d'advisories distinctes.
 *
 * Tronquer la sortie brute produirait un JSON coupé en plein milieu, donc illisible pour
 * le skill — c'était le cas au premier run. On extrait ce qui sert, on jette le reste.
 */
export function resumerAudit(sortieJson) {
  try {
    const brut = JSON.parse(sortieJson)
    const parSeverite = brut.metadata?.vulnerabilities ?? {}
    const advisories = new Set(
      (brut.actions ?? []).flatMap((action) => (action.resolves ?? []).map((r) => r.id)),
    )
    return {
      parSeverite,
      total: Object.values(parSeverite).reduce((a, b) => a + b, 0),
      advisoriesDistinctes: advisories.size,
    }
  } catch {
    return { parSeverite: {}, total: null, advisoriesDistinctes: null, erreur: 'audit illisible' }
  }
}

export function ajouterCommit(report, commit) {
  return { ...report, commits: [...report.commits, commit] }
}

export function ajouterVerdictOverride(report, verdict) {
  return { ...report, overrides: [...report.overrides, verdict] }
}

export function serialiser(report) {
  return JSON.stringify(report, null, 2)
}
