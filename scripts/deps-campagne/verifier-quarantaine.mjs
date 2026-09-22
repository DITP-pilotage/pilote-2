#!/usr/bin/env node
/**
 * Vérifie les exclusions de quarantaine (`minimumReleaseAgeExclude`).
 *
 * Trois campagnes de suite ont laissé des exclusions échues en place, parce que rien ne
 * les regardait : ce sont des trous volontaires dans la mitigation supply-chain, et un
 * trou qu'on oublie de refermer n'est plus volontaire.
 *
 * Sort en non-zéro dès qu'une exclusion est retirable, sans échéance, ou invérifiable.
 * Utilisable seul (`pnpm deps:quarantaine`) comme au début d'une campagne.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  lireExclusions,
  lireMinimumReleaseAge,
  verdictQuarantaine,
  versionsVerrouillees,
  STATUTS_EN_DEFAUT,
} from './lib/quarantaine.mjs'
import { run } from './lib/shell.mjs'

const RACINE = fileURLToPath(new URL('../..', import.meta.url))

/** Date de publication d'une version au registre, ou null si le registre ne répond pas. */
function publieeLe(paquet, version) {
  const resultat = run(['npm', 'view', `${paquet}@${version}`, 'time', '--json'])
  if (resultat.code !== 0) return null
  try {
    const temps = JSON.parse(resultat.stdout)
    const iso = typeof temps === 'string' ? temps : temps?.[version]
    return iso ? new Date(iso) : null
  } catch {
    return null
  }
}

function main() {
  const yaml = readFileSync(`${RACINE}/pnpm-workspace.yaml`, 'utf8')
  const lockfile = readFileSync(`${RACINE}/pnpm-lock.yaml`, 'utf8')

  const exclusions = lireExclusions(yaml)
  const minimumReleaseAgeMinutes = lireMinimumReleaseAge(yaml)
  const aujourdhui = new Date()

  if (exclusions.length === 0) {
    console.log('aucune exclusion de quarantaine déclarée')
    return 0
  }

  const verdicts = exclusions.map((exclusion) => {
    const versions = versionsVerrouillees(exclusion.paquet, lockfile)
    // La plus récente : c'est elle qui décide si l'exclusion est encore nécessaire.
    const version = versions.sort().at(-1) ?? null
    return {
      ...verdictQuarantaine({
        paquet: exclusion.paquet,
        expire: exclusion.expire,
        publieeLe: version ? publieeLe(exclusion.paquet, version) : null,
        aujourdhui,
        minimumReleaseAgeMinutes,
      }),
      version,
    }
  })

  for (const v of verdicts) {
    const marque = STATUTS_EN_DEFAUT.includes(v.statut) ? '✗' : '·'
    const version = v.version ? ` (${v.version})` : ''
    console.log(`${marque} ${v.paquet}${version} — ${v.message}`)
  }

  const enDefaut = verdicts.filter((v) => STATUTS_EN_DEFAUT.includes(v.statut))
  if (enDefaut.length > 0) {
    console.log(`\n${enDefaut.length} exclusion(s) à traiter.`)
    return 1
  }
  console.log('\nToutes les exclusions sont justifiées.')
  return 0
}

process.exit(main())
