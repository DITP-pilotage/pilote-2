import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// fileURLToPath, pas .pathname : ce dernier laisse les séquences percent-encoded.
// Un repo cloné dans "~/My Docs/" donnerait un cwd "/Users/moi/My%20Docs/" inexistant.
const RACINE = fileURLToPath(new URL('../../..', import.meta.url))

/**
 * Exécute une commande à la racine du monorepo, SANS passer par un shell.
 *
 * L'argv est un tableau, jamais une chaîne : cet outil interpole des noms de paquets et
 * des versions qui viennent du registre npm, et les faire traverser un shell rouvrirait
 * exactement la surface d'attaque que `minimumReleaseAge` cherche à réduire. Aucun
 * métacaractère n'est interprété.
 *
 * Ne lève jamais : rend toujours { code, stdout, stderr }. C'est à l'appelant de juger
 * si un code non nul est une erreur — `pnpm outdated` et `pnpm audit` sortent en non-zéro
 * dans leur cas nominal.
 */
export function run(argv, { env = {}, input = undefined } = {}) {
  const [commande, ...args] = argv
  try {
    const stdout = execFileSync(commande, args, {
      cwd: RACINE,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      input,
      stdio: input === undefined ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
    return { code: 0, stdout, stderr: '' }
  } catch (erreur) {
    return {
      code: erreur.status ?? 1,
      stdout: erreur.stdout?.toString() ?? '',
      stderr: erreur.stderr?.toString() ?? '',
    }
  }
}
