/**
 * Le report.json est le seul contrat entre le moteur déterministe et le skill.
 * Il reste volontairement compact : le skill lit des verdicts, jamais des logs bruts.
 * Toutes les fonctions sont pures — elles rendent un nouveau rapport, sans muter l'entrée.
 */

export function creerReport({ date, snapshot }) {
  return { date, snapshot, commits: [], overrides: [] }
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
