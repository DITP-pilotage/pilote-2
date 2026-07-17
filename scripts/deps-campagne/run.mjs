#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { run } from './lib/shell.mjs'
import { parseOutdated, grouperCouples } from './lib/outdated.mjs'
import { verdictOverride, nomPaquetDepuisCle, versionsResoluesDepuisWhy } from './lib/overrides.mjs'
import {
  creerReport,
  ajouterCommit,
  ajouterVerdictOverride,
  serialiser,
  resumerAudit,
} from './lib/report.mjs'
import {
  oracleRapide,
  oracleComplet,
  installer,
  verifierBaseAccessible,
  FILTRES_KPILOTE,
} from './lib/oracle.mjs'

const DOSSIER_SORTIE = '.deps-campagne'

function aujourdhui() {
  return new Date().toISOString().slice(0, 10)
}

function journal(message) {
  console.log(`[campagne] ${message}`)
}

function lireOutdated() {
  // exit 1 = « il y a des deps périmées », ce n'est pas une erreur.
  const { stdout } = run(['pnpm', 'outdated', '-r', ...FILTRES_KPILOTE, '--format', 'json'])
  if (!stdout.trim()) return []
  return parseOutdated(JSON.parse(stdout))
}

function verifierPrealables() {
  const { stdout } = run(['git', 'status', '--porcelain'])
  if (stdout.trim()) {
    throw new Error('working tree sale — commite ou stash avant de lancer la campagne')
  }
  if (!verifierBaseAccessible()) {
    throw new Error(
      'base de dev injoignable — kpilote-api en a besoin même pour son lint (prisma generate --sql). ' +
        'Vérifie que Docker tourne et que la base est levée, puis relance. ' +
        'Le script ne touche jamais aux conteneurs lui-même.',
    )
  }
}

function commiter(message) {
  run(['git', 'add', 'package.json', 'pnpm-lock.yaml', 'apps', 'packages'])
  run(['git', 'commit', '-m', message, '--no-verify'])
  return run(['git', 'rev-parse', '--short', 'HEAD']).stdout.trim()
}

/** Oracle complet seulement si le rapide passe : inutile de tester ce qui ne compile pas. */
function evaluer() {
  const rapide = oracleRapide()
  if (!rapide.ok) return { rapide: false, complet: null, echecs: rapide.echecs }
  const complet = oracleComplet()
  return { rapide: true, complet: complet.ok, echecs: complet.echecs }
}

function versionsResoluesDe(cle) {
  const nom = nomPaquetDepuisCle(cle)
  const { stdout } = run(['pnpm', 'why', nom, '-r', '--json', '--depth', 'Infinity'])
  if (!stdout.trim()) return []
  try {
    return versionsResoluesDepuisWhy(JSON.parse(stdout), nom)
  } catch {
    return []
  }
}

/**
 * Retire chaque override un par un, réinstalle, et observe à quelle version le paquet se
 * résout tout seul. C'est LE test : un override qui ne change plus rien à la résolution
 * est inerte. Le banc d'essai observe, il ne décide pas — package.json est toujours restauré.
 *
 * Monorepo-wide par nature : les overrides vivent à la racine et s'appliquent à ppg aussi.
 */
function bancEssaiOverrides() {
  const pkgRacine = JSON.parse(readFileSync('package.json', 'utf8'))
  const overrides = pkgRacine.pnpm.overrides
  const verdicts = []

  for (const [cle, range] of Object.entries(overrides)) {
    journal(`banc d'essai : ${cle}`)

    const sansCelui = { ...overrides }
    delete sansCelui[cle]
    writeFileSync(
      'package.json',
      JSON.stringify({ ...pkgRacine, pnpm: { ...pkgRacine.pnpm, overrides: sansCelui } }, null, 2) +
        '\n',
    )
    installer()

    // `pnpm install` seul NE RE-RÉSOUT PAS : il garde la version du lockfile tant qu'elle
    // satisfait les ranges des parents. Ça masque tout plafond. Vérifié sur terser : retirer
    // "<5.47.0" puis installer laisse 5.46.2 (verdict « inerte », faux) ; forcer la
    // re-résolution l'envoie en 5.48.0 (verdict « porteur », vrai).
    // Les planchers, eux, provoquent une chute visible dès l'install — mais on force
    // partout, pour poser la même question à tout le monde.
    run(['pnpm', 'update', nomPaquetDepuisCle(cle), '-r', '--depth', 'Infinity'])

    const verdict = verdictOverride({ cle, range, versionsResolues: versionsResoluesDe(cle) })
    verdicts.push(verdict)
    journal(`  -> ${verdict.porteur ? 'PORTEUR' : 'inerte'} : ${verdict.preuve}`)

    // Restaurer TOUT, pas seulement la racine : `pnpm update -r` réécrit aussi les ranges
    // déclarés dans les apps (constaté : hono ^4.12.18 -> ^4.12.27 sur 4 package.json,
    // dont pilote-ppg-auth, hors périmètre). Le banc observe, il ne décide pas.
    run(['git', 'checkout', '--', 'package.json', 'pnpm-lock.yaml', 'apps', 'packages'])
  }

  installer()
  return verdicts
}

/** Après `pnpm update`, on OBSERVE ce qui a bougé — on ne le prédit pas via `wanted`. */
function diffInRange(avant, apres) {
  return avant
    .map((a) => {
      const encore = apres.find((b) => b.name === a.name)
      // Sorti de outdated => la dep a atteint latest.
      if (!encore) return { name: a.name, de: a.current, vers: a.latest }
      // Toujours outdated mais current a changé => elle a monté dans son range, sans atteindre latest.
      if (encore.current !== a.current) return { name: a.name, de: a.current, vers: encore.current }
      return null
    })
    .filter(Boolean)
}

/**
 * Les paquets d'un groupe couplé ne vont pas forcément à la même version : eslint monte en
 * 10.6.0 pendant que @eslint/js monte en 10.0.1. Annoncer « eslint -> 10.0.1 » serait faux.
 */
function libelleCible(groupe) {
  const versions = [...new Set(groupe.deps.map((d) => d.latest))]
  if (versions.length === 1) return `-> ${versions[0]}`
  return `(${groupe.deps.map((d) => `${d.name}@${d.latest}`).join(', ')})`
}

function appliquerGroupe(groupe) {
  for (const dep of groupe.deps) {
    for (const dependent of dep.dependents) {
      const argv = ['pnpm', '-F', dependent, 'add']
      if (dep.estDevDependency) argv.push('-D')
      argv.push(`${dep.name}@${dep.latest}`)
      run(argv)
    }
  }
}

function main() {
  verifierPrealables()

  const date = aujourdhui()
  const depart = lireOutdated()
  const audit = run(['pnpm', 'audit', '--json'])
  journal(
    `départ : ${depart.length} deps périmées, ${depart.filter((d) => d.isMajor).length} majors`,
  )

  const resumeAudit = resumerAudit(audit.stdout)
  journal(
    `  audit : ${resumeAudit.total} vulnérabilités (${JSON.stringify(resumeAudit.parSeverite)})`,
  )

  let report = creerReport({
    date,
    snapshot: {
      outdated: depart.length,
      majors: depart.filter((d) => d.isMajor).length,
      audit: resumeAudit,
    },
  })

  run(['git', 'checkout', '-b', `deps/campagne-${date}`])

  // --- Lot in-range : on fait, puis on observe.
  journal('lot in-range : pnpm update')
  const avant = lireOutdated()
  run(['pnpm', 'update', '-r', ...FILTRES_KPILOTE])
  const apres = lireOutdated()
  const bouges = diffInRange(avant, apres)

  if (bouges.length > 0) {
    const sha = commiter(`chore(deps): bumps in-range (${bouges.length} paquets)`)
    journal(`  ${bouges.length} paquets bougés, commit ${sha}`)
    report = ajouterCommit(report, {
      sha,
      libelle: 'bumps in-range',
      categorie: 'in-range',
      deps: bouges,
      oracle: evaluer(),
    })
  } else {
    journal('  rien à bumper dans les ranges')
  }

  // --- Ce qui reste : pins et majors, groupés par couplage.
  for (const groupe of grouperCouples(apres)) {
    const categorie = groupe.deps.some((d) => d.isMajor) ? 'major' : 'pin-minor'
    const cible = libelleCible(groupe)
    journal(`${categorie} : ${groupe.nom} ${cible}`)

    appliquerGroupe(groupe)

    const sha = commiter(`chore(deps): ${groupe.nom} ${cible} [${categorie}]`)
    report = ajouterCommit(report, {
      sha,
      libelle: `${groupe.nom} (${groupe.deps.map((d) => `${d.name}@${d.latest}`).join(' ')})`,
      categorie,
      deps: groupe.deps.map((d) => ({ name: d.name, de: d.current, vers: d.latest })),
      oracle: evaluer(),
    })
  }

  // --- Banc d'essai des overrides, monorepo-wide.
  for (const verdict of bancEssaiOverrides()) {
    report = ajouterVerdictOverride(report, verdict)
  }

  mkdirSync(DOSSIER_SORTIE, { recursive: true })
  writeFileSync(`${DOSSIER_SORTIE}/report.json`, serialiser(report))
  journal(`report écrit dans ${DOSSIER_SORTIE}/report.json`)
}

main()
